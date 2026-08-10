import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

if (!JWT_SECRET || !ADMIN_PASSWORD) {
  throw new Error(
    "Missing env vars: JWT_SECRET and ADMIN_PASSWORD must be set in .env"
  );
}

export function signToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function authenticate(password: string): boolean {
  return password === ADMIN_PASSWORD;
}