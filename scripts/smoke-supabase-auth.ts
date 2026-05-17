import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) throw new Error("env missing");

const supabase = createClient(url, anon);

(async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log(
    JSON.stringify(
      {
        reachable: !error,
        sessionPresent: !!data.session,
        error: error?.message ?? null,
      },
      null,
      2,
    ),
  );
})();
