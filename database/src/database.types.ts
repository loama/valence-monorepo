export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_audit_events: {
        Row: {
          id: string;
          actor_email: string;
          action: string;
          target_type: string;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_email: string;
          action: string;
          target_type: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_email?: string;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      care_plans: {
        Row: {
          id: string;
          member_profile_id: string;
          title: string;
          summary: string;
          status: Database["public"]["Enums"]["care_plan_status"];
          goals: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_profile_id: string;
          title: string;
          summary: string;
          status?: Database["public"]["Enums"]["care_plan_status"];
          goals?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          member_profile_id?: string;
          title?: string;
          summary?: string;
          status?: Database["public"]["Enums"]["care_plan_status"];
          goals?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "care_plans_member_profile_id_member_profiles_id_fkey";
            columns: ["member_profile_id"];
            referencedRelation: "member_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      check_ins: {
        Row: {
          id: string;
          member_profile_id: string;
          mood: Database["public"]["Enums"]["check_in_mood"];
          note: string | null;
          signals: Json;
          completed_at: string;
        };
        Insert: {
          id?: string;
          member_profile_id: string;
          mood?: Database["public"]["Enums"]["check_in_mood"];
          note?: string | null;
          signals?: Json;
          completed_at?: string;
        };
        Update: {
          id?: string;
          member_profile_id?: string;
          mood?: Database["public"]["Enums"]["check_in_mood"];
          note?: string | null;
          signals?: Json;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_ins_member_profile_id_member_profiles_id_fkey";
            columns: ["member_profile_id"];
            referencedRelation: "member_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      member_profiles: {
        Row: {
          id: string;
          external_user_id: string | null;
          email: string;
          display_name: string;
          status: Database["public"]["Enums"]["member_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_user_id?: string | null;
          email: string;
          display_name: string;
          status?: Database["public"]["Enums"]["member_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_user_id?: string | null;
          email?: string;
          display_name?: string;
          status?: Database["public"]["Enums"]["member_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      care_plan_status: "draft" | "active" | "review" | "completed";
      check_in_mood: "low" | "steady" | "mixed" | "supported" | "urgent";
      member_status: "onboarding" | "active" | "paused" | "archived";
    };
    CompositeTypes: Record<string, never>;
  };
};
