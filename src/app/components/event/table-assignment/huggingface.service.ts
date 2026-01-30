export interface HFGuest {
  id: string;
  name: string;
  tags?: string[];
  tableId?: string | null;
  partySize?: number;
}

export interface HFTable {
  id: string;
  name: string;
  shape: "round" | "square" | "rectangular" | string;
  capacity: number;
  position: { x: number; y: number };
}

export interface SeatingRequest {
  guests: HFGuest[];
  tables: HFTable[];
  userMessage: string;
  constraints?: string[];
}

export interface SeatingResponse {
  assignments: Array<{
    guestId: string;
    tableId: string;
    reasoning?: string;
  }>;
  explanation: string;
  conflicts?: string[];
}

const MODEL = "mistralai/Mistral-7B-Instruct-v0.2"; // change if you prefer another model

function buildSeatingPrompt(request: SeatingRequest): string {
  const { guests, tables, userMessage, constraints } = request;

  const guestList = guests
    .map((g) => {
      const tags = g.tags?.join(", ") || "none";
      const current = g.tableId
        ? ` (currently at ${g.tableId})`
        : " (unassigned)";
      return `- ${g.name} [ID: ${g.id}] - Tags: ${tags}${current}`;
    })
    .join("\n");

  const tableList = tables
    .map((t) => {
      return `- ${t.name} [ID: ${t.id}] - Capacity: ${t.capacity}, Shape: ${t.shape}`;
    })
    .join("\n");

  const constraintText = constraints?.length
    ? `\n\nConstraints:\n${constraints.map((c) => `- ${c}`).join("\n")}`
    : "";

  return `You are a wedding seating arrangement assistant. Your job is to create optimal table assignments based on guest relationships and user preferences.

## Guests
${guestList}

## Available Tables
${tableList}
${constraintText}

## User Request
${userMessage}

## Instructions
1. Analyze the guest tags to understand relationships (e.g., "bride_family", "groom_family", "children", "elderly").
2. Consider table capacities and current assignments.
3. Respond with a JSON object containing your seating recommendations.

## Response Format (JSON only, no markdown)
{
  "assignments": [
    {"guestId": "guest_id", "tableId": "table_id", "reasoning": "brief explanation"}
  ],
  "explanation": "Overall explanation of your seating strategy",
  "conflicts": ["list any potential issues or conflicts"]
}

Respond only with valid JSON, no additional text.`;
}

async function hfFetch(prompt: string) {
  // Proxy the prompt through a server-side Next.js API route to avoid CORS
  // and keep the API key secret. The server route will call Hugging Face.
  const url = "/api/hf";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Hugging Face proxy error: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const data = await res.json().catch(() => null);
  return data;
}

export async function getSeatingRecommendation(
  request: SeatingRequest,
): Promise<SeatingResponse> {
  try {
    const prompt = buildSeatingPrompt(request);
    const data: unknown = await hfFetch(prompt);

    // Try to extract the generated text or message content from common HF shapes
    let text = "";
    const trySetText = (candidate: unknown) => {
      if (!candidate) return false;
      if (typeof candidate === "string") {
        text = candidate;
        return true;
      }
      if (typeof candidate === "object") {
        const c = candidate as any;
        if (typeof c.generated_text === "string") {
          text = c.generated_text;
          return true;
        }
        if (c.message) {
          // message.content can be string or object with parts
          if (typeof c.message.content === "string") {
            text = c.message.content;
            return true;
          }
          if (Array.isArray(c.message.content)) {
            // sometimes content is an array of {type, text}
            const part = c.message.content.find((p: any) => p?.text);
            if (part && typeof part.text === "string") {
              text = part.text;
              return true;
            }
          }
        }
        if (typeof c.text === "string") {
          text = c.text;
          return true;
        }
        if (typeof c.output_text === "string") {
          text = c.output_text;
          return true;
        }
      }
      return false;
    };

    // 1) Direct array response
    if (Array.isArray(data) && data.length > 0) {
      for (const itm of data) {
        if (trySetText(itm)) break;
      }
    }

    // 2) choices array shape (e.g., { choices: [ { message: { content: ... } } ] })
    if (!text && typeof data === "object" && data !== null) {
      const d = data as any;
      if (Array.isArray(d.choices) && d.choices.length > 0) {
        for (const choice of d.choices) {
          // choice may contain message, text, output_text, generated_text
          if (trySetText(choice)) break;
          if (choice.message && trySetText(choice.message)) break;
          if (choice.delta && trySetText(choice.delta)) break;
        }
      }
    }

    // 3) fallback: object with direct fields
    if (!text && typeof data === "object" && data !== null) {
      trySetText(data);
    }

    // 4) string fallback
    if (!text && typeof data === "string") text = data;
    if (!text) {
      // Fallback: try to stringify
      try {
        text = JSON.stringify(data);
      } catch (e) {
        text = String(data);
      }
    }

    // Extract JSON from the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in model response");
    }
    let result: SeatingResponse;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      throw new Error("Failed to parse JSON from model response");
    }
    if (!result.assignments || !Array.isArray(result.assignments)) {
      console.debug("getSeatingRecommendation: parsed JSON:", result);
      console.debug("getSeatingRecommendation: raw text:", text);
      throw new Error("Invalid response structure from model");
    }
    return result;
  } catch (err) {
    console.error("getSeatingRecommendation error:", err);
    throw err;
  }
}

export async function testHuggingFaceConnection(): Promise<boolean> {
  try {
    const prompt = "Hello, this is a quick connectivity test.";
    const data: unknown = await hfFetch(prompt);
    if (!data) return false;

    if (Array.isArray(data) && data.length > 0) return true;
    if (typeof data === "object") return true;
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}
