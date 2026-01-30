import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Only keep the correct try/catch block and logic below
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
      });
    }

    const MODEL = "deepseek-ai/DeepSeek-V3.2";
    const HF_API_KEY =
      process.env.HUGGINGFACE_API_KEY ||
      process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
    if (!HF_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "Hugging Face API key not configured on server",
        }),
        { status: 500 },
      );
    }

    // Use the Hugging Face chat completions endpoint
    const url = "https://router.huggingface.co/v1/chat/completions";

    // Format request as per docs
    const body = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1200,
      temperature: 0.7,
      top_p: 0.9,
      stream: false,
    };

    const hfRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await hfRes.text();

    if (!hfRes.ok) {
      console.error("HF API Error:", hfRes.status, text);
    }

    return new Response(text, {
      status: hfRes.status,
      headers: {
        "Content-Type": hfRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
