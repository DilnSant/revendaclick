/**
 * Auto-generated types for Supabase.
 * Run: npx supabase gen types typescript --project-id <id> > lib/database.types.ts
 *
 * This stub keeps TypeScript happy until you generate the real types.
 */
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>
    Views: Record<string, { Row: Record<string, unknown> }>
    Functions: Record<string, unknown>
    Enums: Record<string, string>
  }
}
