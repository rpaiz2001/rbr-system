import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return new Response(
    JSON.stringify({ status: "ok", message: "Test endpoint working" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
