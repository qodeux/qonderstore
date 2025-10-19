import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL) throw new Error('Falta SUPABASE_URL')
if (!SUPABASE_KEY) throw new Error('Falta SUPABASE_KEY')
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY')

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
