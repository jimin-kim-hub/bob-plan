import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_for_mvp";
const key = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: { userId: string, email: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as { userId: string, email: string };
  } catch {
    return null;
  }
}
