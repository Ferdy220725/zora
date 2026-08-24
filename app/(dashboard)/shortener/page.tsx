import { createClient } from "@/utils/supabase/server";
import ShortenerClient from "./shortener-client";

export default async function ShortenerPage() {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  return <ShortenerClient initialLinks={links ?? []} currentUserId={user?.id ?? null} />;
}