import crypto from "crypto";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_session_key_for_gavel_club_webmaster_2026";
const COOKIE_NAME = "gavel_admin_session";

export function signToken(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours expiry
    })
  ).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): Record<string, any> | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const decodedBody = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (decodedBody.exp && decodedBody.exp < Date.now() / 1000) {
      return null; // expired
    }
    return decodedBody;
  } catch (e) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSession(username: string) {
  const token = signToken({ username });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}
