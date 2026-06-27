import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT as string,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function POST(req: NextRequest) {
  try {
    const { title, body, url } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "title dan body wajib diisi" }, { status: 400 });
    }

    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "Belum ada subscriber" });
    }

    const payload = JSON.stringify({ title, body, url: url || "/" });

    const results = await Promise.allSettled(
      subs.map((sub) => webpush.sendNotification(sub.subscription, payload))
    );

    // Hapus subscription yang sudah expired/invalid
    const toDelete: string[] = [];
    results.forEach((result, i) => {
      if (
        result.status === "rejected" &&
        (result.reason?.statusCode === 410 || result.reason?.statusCode === 404)
      ) {
        toDelete.push(subs[i].endpoint);
      }
    });

    if (toDelete.length > 0) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", toDelete);
    }

    const sentCount = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({ success: true, sent: sentCount, total: subs.length });
  } catch (err) {
    console.error("Error send-notification:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}