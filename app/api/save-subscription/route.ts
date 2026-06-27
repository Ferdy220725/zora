import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Pakai service role key di server biar bisa insert tanpa kena RLS (Row Level Security)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Subscription tidak valid" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: subscription.endpoint,
          subscription: subscription,
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error save-subscription:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}