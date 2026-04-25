// Virtual Try-On edge function
// Pipeline: validate input -> call Replicate IDM-VTON (person + garment) -> poll -> return result image
// IDM-VTON internally handles: person detection, pose estimation, segmentation, garment warping & blending.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Pinned IDM-VTON version on Replicate (high-quality realistic try-on)
const MODEL_VERSION =
  "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4";

interface TryOnRequest {
  human_image: string; // data URL or https URL
  garment_image: string; // https URL
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
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      return json({ error: "REPLICATE_API_KEY is not configured" }, 500);
    }

    const body = (await req.json()) as TryOnRequest;
    if (!isValidImage(body.human_image)) {
      return json({ error: "Invalid human_image. Provide a data URL or https URL." }, 400);
    }
    if (!isValidImage(body.garment_image)) {
      return json({ error: "Invalid garment_image." }, 400);
    }

    const input = {
      human_img: body.human_image,
      garm_img: body.garment_image,
      garment_des: body.garment_description ?? "a clothing item",
      category: body.category ?? "upper_body",
      crop: false,
      seed: 42,
      steps: 30,
    };

    // 1) Create prediction
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
        Prefer: "wait=60", // server holds the connection up to 60s if it finishes early
      },
      body: JSON.stringify({ version: MODEL_VERSION, input }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Replicate create error:", createRes.status, err);
      if (createRes.status === 401) {
        return json({ error: "Invalid Replicate API key." }, 401);
      }
      if (createRes.status === 402) {
        return json({ error: "Replicate account requires billing setup or credits." }, 402);
      }
      return json({ error: `Try-on service error (${createRes.status})` }, 502);
    }

    let prediction = await createRes.json();

    // 2) Poll until done (up to ~90s)
    const started = Date.now();
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled" &&
      Date.now() - started < 90_000
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      const pollRes = await fetch(prediction.urls.get, {
        headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` },
      });
      if (!pollRes.ok) {
        const err = await pollRes.text();
        console.error("Replicate poll error:", pollRes.status, err);
        break;
      }
      prediction = await pollRes.json();
    }

    if (prediction.status !== "succeeded") {
      console.error("Prediction did not succeed:", prediction.status, prediction.error);
      return json(
        {
          error:
            prediction.error ??
            "Try-on failed. Make sure the photo clearly shows one person, facing forward, upper body visible.",
        },
        422,
      );
    }

    const output = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output;
    if (!output) return json({ error: "No output produced." }, 502);

    return json({ image_url: output, prediction_id: prediction.id }, 200);
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
