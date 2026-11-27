import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const apiUrl = () => process.env.KDSA_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${apiUrl()}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { liveBackend: false, error: payload.error || "Local RAG API is unavailable." },
        { status: 503 }
      );
    }
    return NextResponse.json({ ...payload, liveBackend: true });
  } catch {
    return NextResponse.json(
      { liveBackend: false, error: "Cannot reach the local RAG API." },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  let body: { query?: unknown; mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body.query !== "string" || !body.query.trim()) {
    return NextResponse.json({ error: "Enter a Java or DSA question to search." }, { status: 400 });
  }
  const query = body.query.trim();
  if (query.length > 2000) {
    return NextResponse.json({ error: "Keep the query under 2,000 characters." }, { status: 413 });
  }
  if (body.mode !== "standard" && body.mode !== "deep") {
    return NextResponse.json({ error: "Choose Standard or Deep Search." }, { status: 400 });
  }
  const mode = body.mode;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110_000);

  try {
    const response = await fetch(`${apiUrl()}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, mode, k: mode === "deep" ? 6 : 4 }),
      signal: controller.signal,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!payload || !response.ok) {
      return NextResponse.json(
        { error: payload?.error || "The local RAG API could not complete this search." },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }
    return NextResponse.json({ ...payload, backend: "live-qdrant" });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: timedOut
          ? "Search timed out. Try Standard mode or a shorter query."
          : "Cannot reach the local RAG API. Start it with: uv run python kdsa_api.py",
      },
      { status: timedOut ? 504 : 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
