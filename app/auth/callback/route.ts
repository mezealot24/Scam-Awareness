import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createServerClient()

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Get the user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Check if user exists in our users table
      const { data: existingUser } = await supabase.from("users").select().eq("id", user.id).single()

      // If not, insert the user
      if (!existingUser) {
        await supabase.from("users").insert([
          {
            id: user.id,
            email: user.email,
            auth_provider: "google",
            provider_id: user.id,
            display_name: user.email?.split("@")[0] || "User",
          },
        ])
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/quiz", request.url))
}

