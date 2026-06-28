import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { createSupabaseServerClientFromEnv } from "@eurostore/database";
import { checkRateLimit } from "@eurostore/shared";
import { headers, cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimit = await checkRateLimit("api", ip);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const cookieStore = headers(); // Next.js cookies or headers
    const supabase = createSupabaseServerClientFromEnv(cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("customer_profiles")
      .select("loyalty_points")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const points = profile.loyalty_points || 0;
    // PRD rule: 100 points = 500 SYP discount -> 1 point = 5 SYP
    const pointsValue_syp = points * 5;

    return NextResponse.json({
      points,
      pendingPoints: 0, // Not explicitly defined in DB, defaulting to 0
      pointsValue_syp,
    });
  } catch (error) {
    console.error("Loyalty balance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
