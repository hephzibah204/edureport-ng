import { verifyToken } from "../src/lib/auth";

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: (request: Request) => Promise<Response>;
}): Promise<Response> {
  const { request, next } = context;
  const url = new URL(request.url);

  // Always pass CORS preflight through so browsers can complete cross-origin requests
  if (request.method === "OPTIONS") {
    return next(request);
  }

  // Skip auth for login, register, and public routes
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/check-domain",
    "/api/auth/school-public",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/config",
    "/api/healthz",
    "/api/health",
    "/api/files"
  ];
  if (publicPaths.some((p) => url.pathname.startsWith(p))) {
    return next(request);
  }

  // For API routes, verify token from Authorization header or cookie
  if (url.pathname.startsWith("/api/")) {
    const origin = request.headers.get("Origin") || "*";
    const authHeader = request.headers.get("Authorization");
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      const cookie = request.headers.get("Cookie") || "";
      const match = cookie.match(/(?:^|;\s*)token=([^;]*)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    if (!token) {
      return new Response(JSON.stringify({ error: { message: "Authentication required" } }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    const session = await verifyToken(token, context.env.JWT_SECRET);
    if (!session) {
      return new Response(JSON.stringify({ error: { message: "Invalid or expired token" } }), {
        status: 401,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    // Clone request with session info in headers for downstream handlers
    const newRequest = new Request(request, {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        "X-User-Id": session.userId,
        "X-User-Email": session.email,
        "X-User-Role": session.role,
        "X-School-Id": session.schoolId || "",
      }),
    });

    return next(newRequest);
  }

  return next(request);
}
