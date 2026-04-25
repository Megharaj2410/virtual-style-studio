// Virtual Try-On edge function (Gemini image editing via Lovable AI)
// Takes a person photo + a garment image and composites a try-on result.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TryOnRequest {
  human_image: string; // data URL or https URL
  garment_image: string; // data URL or https URL
  garment_description?: string;
  category?: "upper_body" | "lower_body" | "dresses";
}

function isValidImage(input: unknown): input is string {
  if (typeof input !== "string" || input.length < 20) return false;
  return input.startsWith("data:image/") || input.startsWith("https://");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY is not configured" }, 500);
    }

    const body = (await req.json()) as TryOnRequest;
    if (!isValidImage(body.human_image)) {
      return json({ error: "Invalid human_image. Provide a data URL or https URL." }, 400);
    }
    if (!isValidImage(body.garment_image)) {
      return json({ error: "Invalid garment_image." }, 400);
    }

    // Gemini fetches https URLs itself but our garment URLs point to Vite-served
    // module paths that return JS, not images. Fetch + convert to data URL ourselves.
    const toDataUrl = async (src: string): Promise<string> => {
      if (src.startsWith("data:image/")) return src;
      const r = await fetch(src);
      if (!r.ok) throw new Error(`Failed to fetch image (${r.status}): ${src}`);
      const ct = r.headers.get("content-type") ?? "";
      if (!ct.startsWith("image/")) {
        throw new Error(`URL did not return an image (got ${ct}): ${src}`);
      }
      const buf = new Uint8Array(await r.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      return `data:${ct};base64,${btoa(bin)}`;
    };

    let humanDataUrl: string;
    let garmentDataUrl: string;
    try {
      [humanDataUrl, garmentDataUrl] = await Promise.all([
        toDataUrl(body.human_image),
        toDataUrl(body.garment_image),
      ]);
    } catch (e) {
      console.error("Image fetch error:", e);
      return json(
        { error: e instanceof Error ? e.message : "Could not load input images." },
        400,
      );
    }

    const garmentDesc = body.garment_description ?? "the clothing item";
    const category = body.category ?? "upper_body";
    const placement =
      category === "lower_body"
        ? "lower body (pants/skirt area)"
        : category === "dresses"
        ? "full body as a dress"
        : "upper body (torso)";

    const prompt = `Output ONLY an image, no text. Virtual try-on: take the person from the FIRST image and dress them in ${garmentDesc} (shown in the SECOND image) on their ${placement}. Preserve the person's face, hair, skin, body shape, pose, background, and lighting EXACTLY. Replace only the clothing in the ${placement} area with the garment, matching its color, pattern, and texture faithfully. Photorealistic, natural fit and shadows. No text, no watermarks.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: humanDataUrl } },
              { type: "image_url", image_url: { url: garmentDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Lovable AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return json({ error: "Rate limit reached. Please wait a moment and try again." }, 429);
      }
      if (aiRes.status === 402) {
        return json(
          { error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." },
          402,
        );
      }
      return json({ error: `Try-on service error (${aiRes.status})` }, 502);
    }

    const data = await aiRes.json();
    const imageUrl: string | undefined =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return json(
        {
          error:
            "No try-on image was produced. Try a clearer photo of one person facing forward.",
        },
        502,
      );
    }

    return json({ image_url: imageUrl }, 200);
  } catch (e) {
    console.error("virtual-tryon error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
