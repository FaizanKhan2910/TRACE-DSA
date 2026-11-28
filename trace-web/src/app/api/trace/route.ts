import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const apiUrl = () =>
  (process.env.KDSA_API_URL ||
    process.env.TRACE_API_URL ||
    "https://trace-kunal-kushwaha-dsa-lecture.onrender.com").replace(/\/$/, "");

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${apiUrl()}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          liveBackend: false,
          error: payload.error || "Live RAG backend is unavailable.",
        },
        { status: response.status >= 500 ? 503 : response.status }
      );
    }

    return NextResponse.json({
      ...payload,
      liveBackend: true,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        ok: false,
        liveBackend: false,
        error: timedOut
          ? "Backend health check timed out (Render service may be waking up)."
          : "Cannot reach the deployed RAG backend.",
      },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  let body: { query?: unknown; mode?: unknown; k?: unknown; threshold?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (typeof body.query !== "string" || !body.query.trim()) {
    return NextResponse.json(
      { ok: false, error: "Enter a Java or DSA question to search." },
      { status: 400 }
    );
  }

  const query = body.query.trim();

  if (query.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "Keep the query under 2,000 characters." },
      { status: 413 }
    );
  }

  const mode = body.mode === "deep" ? "deep" : "standard";
  const defaultK = mode === "deep" ? 14 : 8;
  const k = typeof body.k === "number" && body.k > 0 ? Math.min(30, Math.floor(body.k)) : defaultK;

  const controller = new AbortController();
  // 110s timeout to allow for Render cold starts and Groq synthesis
  const timeout = setTimeout(() => controller.abort(), 110000);

  try {
    const response = await fetch(`${apiUrl()}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        mode,
        k,
        ...(typeof body.threshold === "number" ? { threshold: body.threshold } : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!payload || !response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            payload?.error || "The live RAG backend could not complete this search.",
          error_type: payload?.error_type,
        },
        {
          status: response.status >= 400 ? response.status : 502,
        }
      );
    }

    return NextResponse.json({
      ...payload,
      backend: "live-qdrant",
    });
  } catch (error) {
    const timedOut =
      error instanceof Error && error.name === "AbortError";

    return NextResponse.json(
      {
        ok: false,
        error: timedOut
          ? "Search timed out. Render may be undergoing a cold start; please retry in a moment."
          : "Cannot reach the deployed RAG backend. Check the Render service.",
      },
      { status: timedOut ? 504 : 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
