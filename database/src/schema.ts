import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const memberStatus = pgEnum("member_status", [
  "onboarding",
  "active",
  "paused",
  "archived"
]);

export const carePlanStatus = pgEnum("care_plan_status", [
  "draft",
  "active",
  "review",
  "completed"
]);

export const checkInMood = pgEnum("check_in_mood", [
  "low",
  "steady",
  "mixed",
  "supported",
  "urgent"
]);

export const userRole = pgEnum("user_role", ["patient", "provider", "admin"]);
export const appointmentStatus = pgEnum("appointment_status", [
  "requested",
  "confirmed",
  "completed",
  "cancelled"
]);
export const appointmentModality = pgEnum("appointment_modality", [
  "video",
  "in_person",
  "hybrid"
]);
export const connectionRequestStatus = pgEnum("connection_request_status", [
  "pending",
  "accepted",
  "declined",
  "cancelled"
]);
export const conversationType = pgEnum("conversation_type", [
  "care_team",
  "appointment",
  "support"
]);
export const messageDeliveryStatus = pgEnum("message_delivery_status", [
  "sent",
  "delivered",
  "read"
]);
export const appPlatform = pgEnum("app_platform", ["ios", "android", "web"]);
export const appVersionStatus = pgEnum("app_version_status", [
  "draft",
  "released",
  "deprecated"
]);

export const memberProfiles = pgTable(
  "member_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalUserId: uuid("external_user_id"),
    email: varchar("email", { length: 320 }).notNull().unique(),
    displayName: text("display_name").notNull(),
    status: memberStatus("status").default("onboarding").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("member_profiles_status_idx").on(table.status),
    index("member_profiles_external_user_id_idx").on(table.externalUserId)
  ]
);

export const carePlans = pgTable(
  "care_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberProfileId: uuid("member_profile_id")
      .notNull()
      .references(() => memberProfiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    status: carePlanStatus("status").default("draft").notNull(),
    goals: jsonb("goals")
      .$type<Array<{ label: string; target?: string }>>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("care_plans_member_profile_id_idx").on(table.memberProfileId),
    index("care_plans_status_idx").on(table.status)
  ]
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberProfileId: uuid("member_profile_id")
      .notNull()
      .references(() => memberProfiles.id, { onDelete: "cascade" }),
    mood: checkInMood("mood").default("steady").notNull(),
    note: text("note"),
    signals: jsonb("signals")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("check_ins_member_profile_id_idx").on(table.memberProfileId),
    index("check_ins_completed_at_idx").on(table.completedAt)
  ]
);

export const adminAuditEvents = pgTable(
  "admin_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorEmail: varchar("actor_email", { length: 320 }).notNull(),
    action: varchar("action", { length: 120 }).notNull(),
    targetType: varchar("target_type", { length: 80 }).notNull(),
    targetId: uuid("target_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("admin_audit_events_actor_email_idx").on(table.actorEmail),
    index("admin_audit_events_created_at_idx").on(table.createdAt)
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: uuid("auth_user_id").unique(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    displayName: text("display_name").notNull(),
    role: userRole("role").notNull(),
    avatarUrl: text("avatar_url"),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("users_auth_user_id_idx").on(table.authUserId),
    index("users_role_idx").on(table.role)
  ]
);

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preferredName: text("preferred_name").notNull(),
    careGoals: jsonb("care_goals")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    riskLevel: text("risk_level").default("low").notNull(),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [index("patients_user_id_idx").on(table.userId)]
);

export const providers = pgTable(
  "providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    specialties: text("specialties").array().default(sql`'{}'::text[]`).notNull(),
    modalities: appointmentModality("modalities")
      .array()
      .default(sql`'{}'::appointment_modality[]`)
      .notNull(),
    bio: text("bio"),
    searchCode: text("search_code").unique(),
    searchable: boolean("searchable").default(true).notNull(),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("providers_user_id_idx").on(table.userId),
    index("providers_search_code_idx").on(table.searchCode)
  ]
);

export const therapistConnectionRequests = pgTable(
  "therapist_connection_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    status: connectionRequestStatus("status").default("pending").notNull(),
    message: text("message"),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("therapist_connection_requests_patient_id_idx").on(table.patientId),
    index("therapist_connection_requests_provider_id_idx").on(table.providerId)
  ]
);

export const patientProviderConnections = pgTable(
  "patient_provider_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    acceptedRequestId: uuid("accepted_request_id").references(
      () => therapistConnectionRequests.id,
      { onDelete: "set null" }
    ),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true })
  },
  (table) => [
    index("patient_provider_connections_patient_id_idx").on(table.patientId),
    index("patient_provider_connections_provider_id_idx").on(table.providerId)
  ]
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    connectionId: uuid("connection_id").references(
      () => patientProviderConnections.id,
      { onDelete: "set null" }
    ),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatus("status").default("requested").notNull(),
    modality: appointmentModality("modality").default("video").notNull(),
    location: text("location"),
    dailyRoomName: text("daily_room_name"),
    dailyRoomUrl: text("daily_room_url"),
    dailyRoomExpiresAt: timestamp("daily_room_expires_at", { withTimezone: true }),
    notes: text("notes"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("appointments_patient_id_idx").on(table.patientId),
    index("appointments_provider_id_idx").on(table.providerId),
    index("appointments_starts_at_idx").on(table.startsAt)
  ]
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null"
  }),
  type: conversationType("type").default("care_team").notNull(),
  title: text("title").notNull(),
  isDemo: boolean("is_demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadMessageId: uuid("last_read_message_id"),
    unreadCount: integer("unread_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] })
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    body: text("body").notNull(),
    deliveryStatus: messageDeliveryStatus("delivery_status")
      .default("sent")
      .notNull(),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true })
  },
  (table) => [
    index("messages_conversation_id_created_at_idx").on(
      table.conversationId,
      table.createdAt
    )
  ]
);

export const clinicalNotes = pgTable(
  "clinical_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null"
    }),
    encryptedBody: text("encrypted_body").notNull(),
    encryptionKeyId: text("encryption_key_id").notNull(),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [index("clinical_notes_patient_id_idx").on(table.patientId)]
);

export const patientCheckIns = pgTable(
  "patient_check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    mood: text("mood").notNull(),
    stressLevel: integer("stress_level").notNull(),
    topics: text("topics").array().default(sql`'{}'::text[]`).notNull(),
    encryptedNote: text("encrypted_note"),
    encryptionKeyId: text("encryption_key_id"),
    isDemo: boolean("is_demo").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("patient_check_ins_patient_id_created_at_idx").on(
      table.patientId,
      table.createdAt
    )
  ]
);

export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  durationMinutes: integer("duration_minutes").default(5).notNull(),
  isDemo: boolean("is_demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const patientExercises = pgTable("patient_exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  status: text("status").default("assigned").notNull(),
  progress: integer("progress").default(0).notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true })
});

export const appVersions = pgTable(
  "app_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    platform: appPlatform("platform").notNull(),
    releaseNumber: integer("release_number").notNull(),
    bundleVersion: text("bundle_version").notNull(),
    capgoChannel: text("capgo_channel").default("production").notNull(),
    status: appVersionStatus("status").default("released").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("app_versions_platform_release_idx").on(
      table.platform,
      table.releaseNumber
    ),
    uniqueIndex("app_versions_platform_release_channel_idx").on(
      table.platform,
      table.releaseNumber,
      table.capgoChannel
    )
  ]
);

export const devicePushTokens = pgTable("device_push_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  platform: appPlatform("platform").notNull(),
  token: text("token").notNull().unique(),
  badgeCount: integer("badge_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("notification_events_user_id_created_at_idx").on(
      table.userId,
      table.createdAt
    )
  ]
);

export const dailyRooms = pgTable("daily_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointmentId: uuid("appointment_id")
    .notNull()
    .unique()
    .references(() => appointments.id, { onDelete: "cascade" }),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true })
});
