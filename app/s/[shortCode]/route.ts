import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;
  const supabase = await createClient();

  const { data: link, error } = await supabase
    .from("links")
    .select("original_url")
    .eq("short_code", shortCode)
    .single();

  if (error || !link) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  supabase.rpc("increment_link_clicks", { link_short_code: shortCode }).then();

  return NextResponse.redirect(link.original_url);
}