CREATE TYPE "care_plan_status" AS ENUM('draft', 'active', 'review', 'completed');--> statement-breakpoint
CREATE TYPE "check_in_mood" AS ENUM('low', 'steady', 'mixed', 'supported', 'urgent');--> statement-breakpoint
CREATE TYPE "member_status" AS ENUM('onboarding', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TABLE "admin_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"actor_email" varchar(320) NOT NULL,
	"action" varchar(120) NOT NULL,
	"target_type" varchar(80) NOT NULL,
	"target_id" uuid,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"member_profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"status" "care_plan_status" DEFAULT 'draft'::"care_plan_status" NOT NULL,
	"goals" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"member_profile_id" uuid NOT NULL,
	"mood" "check_in_mood" DEFAULT 'steady'::"check_in_mood" NOT NULL,
	"note" text,
	"signals" jsonb DEFAULT '{}' NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"external_user_id" uuid,
	"email" varchar(320) NOT NULL UNIQUE,
	"display_name" text NOT NULL,
	"status" "member_status" DEFAULT 'onboarding'::"member_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admin_audit_events_actor_email_idx" ON "admin_audit_events" ("actor_email");--> statement-breakpoint
CREATE INDEX "admin_audit_events_created_at_idx" ON "admin_audit_events" ("created_at");--> statement-breakpoint
CREATE INDEX "care_plans_member_profile_id_idx" ON "care_plans" ("member_profile_id");--> statement-breakpoint
CREATE INDEX "care_plans_status_idx" ON "care_plans" ("status");--> statement-breakpoint
CREATE INDEX "check_ins_member_profile_id_idx" ON "check_ins" ("member_profile_id");--> statement-breakpoint
CREATE INDEX "check_ins_completed_at_idx" ON "check_ins" ("completed_at");--> statement-breakpoint
CREATE INDEX "member_profiles_status_idx" ON "member_profiles" ("status");--> statement-breakpoint
CREATE INDEX "member_profiles_external_user_id_idx" ON "member_profiles" ("external_user_id");--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_member_profile_id_member_profiles_id_fkey" FOREIGN KEY ("member_profile_id") REFERENCES "member_profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_member_profile_id_member_profiles_id_fkey" FOREIGN KEY ("member_profile_id") REFERENCES "member_profiles"("id") ON DELETE CASCADE;