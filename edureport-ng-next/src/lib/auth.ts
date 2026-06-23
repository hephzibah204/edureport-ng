import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ALGORITHM = "HS256";
const ISSUER = "edureport-ng";
const DEFAULT_SECRET = "edureport-ng-default-secret-change-in-production-min-32-chars!";

function getSecret(customSecret?: string): Uint8Array {
  // Safe check for process.env to avoid "process is not defined" in Cloudflare Workers
  const envSecret = typeof process !== "undefined" ? process.env?.JWT_SECRET : undefined;
  const secret = customSecret || envSecret || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  schoolId?: string;
}

export async function signToken(payload: Omit<SessionPayload, "exp" | "iat" | "iss">, secret?: string): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime("7d")
    .sign(getSecret(secret));
}

export async function verifyToken(token: string, secret?: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(secret), {
      issuer: ISSUER,
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}
