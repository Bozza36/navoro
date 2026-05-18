export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      lessons: {
        Row: {
          category: Database["public"]["Enums"]["lesson_category"]
          content: Json
          created_at: string
          description: string
          estimated_minutes: number | null
          id: string
          level: number
          order_index: number
          path_group: string
          project_thread: string | null
          stage_index: number | null
          stage_name: string | null
          task_index: number | null
          task_type: string | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          category: Database["public"]["Enums"]["lesson_category"]
          content?: Json
          created_at?: string
          description: string
          estimated_minutes?: number | null
          id?: string
          level: number
          order_index: number
          path_group?: string
          project_thread?: string | null
          stage_index?: number | null
          stage_name?: string | null
          task_index?: number | null
          task_type?: string | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["lesson_category"]
          content?: Json
          created_at?: string
          description?: string
          estimated_minutes?: number | null
          id?: string
          level?: number
          order_index?: number
          path_group?: string
          project_thread?: string | null
          stage_index?: number | null
          stage_name?: string | null
          task_index?: number | null
          task_type?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_level: Database["public"]["Enums"]["career_level"]
          display_name: string | null
          id: string
          is_pro: boolean
          last_lesson_date: string | null
          streak_count: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: Database["public"]["Enums"]["career_level"]
          display_name?: string | null
          id?: string
          is_pro?: boolean
          last_lesson_date?: string | null
          streak_count?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: Database["public"]["Enums"]["career_level"]
          display_name?: string | null
          id?: string
          is_pro?: boolean
          last_lesson_date?: string | null
          streak_count?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          selected_choice: number | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          selected_choice?: number | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          selected_choice?: number | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      dhf_documents: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          task_index: number
          doc_code: string
          doc_title: string
          doc_section: string | null
          body_markdown: string
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          task_index?: number
          doc_code: string
          doc_title: string
          doc_section?: string | null
          body_markdown: string
          score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          task_index?: number
          doc_code?: string
          doc_title?: string
          doc_section?: string | null
          body_markdown?: string
          score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dhf_documents_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      level_completions: {
        Row: {
          id: string
          user_id: string
          category: Database["public"]["Enums"]["lesson_category"]
          level: number
          completed_at: string
          team_review: Json
        }
        Insert: {
          id?: string
          user_id: string
          category: Database["public"]["Enums"]["lesson_category"]
          level: number
          completed_at?: string
          team_review?: Json
        }
        Update: {
          id?: string
          user_id?: string
          category?: Database["public"]["Enums"]["lesson_category"]
          level?: number
          completed_at?: string
          team_review?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      career_level:
        | "Explorer"
        | "Apprentice"
        | "Practitioner"
        | "Specialist"
        | "Professional"
        | "Expert"
        | "Leader"
      lesson_category:
        | "Mechanical"
        | "Biomedical"
        | "Civil"
        | "Aerospace"
        | "Surgical Residency"
        | "Medical Research"
        | "Health Informatics"
        | "Product Management"
        | "AI Ethics"
        | "Corporate Law"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      career_level: [
        "Explorer",
        "Apprentice",
        "Practitioner",
        "Specialist",
        "Professional",
        "Expert",
        "Leader",
      ],
      lesson_category: [
        "Mechanical",
        "Biomedical",
        "Civil",
        "Aerospace",
        "Surgical Residency",
        "Medical Research",
        "Health Informatics",
        "Product Management",
        "AI Ethics",
        "Corporate Law",
      ],
    },
  },
} as const
