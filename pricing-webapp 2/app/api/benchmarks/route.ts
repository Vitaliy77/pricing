import { NextRequest } from "next/server";
import { getBenchmarks } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("activityCode") || "";
  if (!code) return new Response(JSON.stringify({}), { status: 400 });
  const b = await getBenchmarks(code);
  return new Response(JSON.stringify(b ?? {}), { headers: { "content-type": "application/json" }});
}
