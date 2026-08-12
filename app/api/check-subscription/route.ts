import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ subscribed: false }, { status: 200 });
    }
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ subscribed: false }, { status: 200 });
    }
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id")
      .eq("user_id", userData.user.id)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Error check-subscription:", error);
      return NextResponse.json({ subscribed: false }, { status: 200 });
    }
    return NextResponse.json({ subscribed: !!data });
  } catch (err) {
    console.error("Error check-subscription:", err);
    return NextResponse.json({ subscribed: false }, { status: 200 });
  }
}