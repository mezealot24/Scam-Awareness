import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export function createServerClient() {
  const cookieStore = cookies()

  return createServerComponentClient({
    cookies: () => cookieStore
  }, {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_ANON_KEY!,
  })
}

