import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
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
