import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

/** Create a signed JWT for a session ({ role, studentId? }). */
export function signToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function hashPassword(plain) {
  return bcrypt.hashSync(String(plain), 10);
}

/** Supports both hashed (new) and plaintext (legacy seed) stored passwords. */
export function verifyPassword(plain, stored) {
  if (!stored) return false;
  const s = String(stored);
  if (s.startsWith("$2")) return bcrypt.compareSync(String(plain), s);
  return s === String(plain);
}

/** Blocks the request unless a valid Bearer token is present. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Session expired, please sign in again" });
  }
}

/** Must run after requireAuth. Admin-only guard for management endpoints. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admins only" });
  return next();
}

/** Students may only read/write their own record. */
export function requireSelfOrAdmin(req, res, next) {
  const id = req.params.id;
  if (req.user?.role === "admin" || req.user?.studentId === id) return next();
  return res.status(403).json({ message: "You can only access your own record" });
}
