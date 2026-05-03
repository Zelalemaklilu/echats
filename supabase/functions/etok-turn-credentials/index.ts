// Cloudflare Calls TURN ephemeral credentials issuer
// Returns short-lived ICE servers (STUN + TURN) for WebRTC clients.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require authenticated caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const TOKEN_ID = Deno.env.get("CLOUDFLARE_TURN_TOKEN_ID");
    const TOKEN_API = Deno.env.get("CLOUDFLARE_TURN_TOKEN_API");

    // Always include public STUN as fallback
    const stunServers: RTCIceServer[] = [
      { urls: "stun:stun.cloudflare.com:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ];

    if (!TOKEN_ID || !TOKEN_API) {
      return json({ iceServers: stunServers, ttl: 3600, source: "stun-only" });
    }

    // Cloudflare Calls — generate ephemeral TURN credentials
    // Docs: POST https://rtc.live.cloudflare.com/v1/turn/keys/{TOKEN_ID}/credentials/generate
    const ttl = 3600; // 1h
    const cfRes = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${TOKEN_ID}/credentials/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN_API}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl }),
      },
    );

    if (!cfRes.ok) {
      const text = await cfRes.text();
      console.error("[etok-turn] Cloudflare error", cfRes.status, text);
      return json({ iceServers: stunServers, ttl, source: "stun-fallback", warn: text });
    }

    const cf = await cfRes.json() as {
      iceServers?: { urls: string | string[]; username?: string; credential?: string };
    };

    const iceServers: RTCIceServer[] = [...stunServers];
    if (cf.iceServers) {
      iceServers.push({
        urls: cf.iceServers.urls,
        username: cf.iceServers.username,
        credential: cf.iceServers.credential,
      });
    }

    return json({ iceServers, ttl, source: "cloudflare" });
  } catch (e: any) {
    console.error("[etok-turn] error", e);
    return json({ error: e?.message ?? "internal" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
