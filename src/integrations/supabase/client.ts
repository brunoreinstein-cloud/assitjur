import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fgjypmlszuzkgvhuszxn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnanlwbWxzenV6a2d2aHVzenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzE4MjQsImV4cCI6MjA3MTYwNzgyNH0.lN-Anhn1e-2SCDIAe6megYRHdhofe1VO71D6-Zk70XU'

export const supabase = createClient(supabaseUrl, supabaseKey)
export type { Database } from '@/integrations/supabase/types'
