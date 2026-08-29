import { Router } from "express";
import { Admin, Student } from "../models.js";
import { signToken, verifyPassword, requireAuth } from "../auth.js";
import { STUDENT_DEMO_PASSWORD } from "../data.js";

const router = Router();

/** POST /api/auth/login — role based sign in for admin and students, returns a JWT. */
router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password)
    return res.status(400).json({ message: "Username and password are required" });

  const u = String(username).trim().toLowerCase();
  const admin = await Admin.findOne().lean();

  if (admin && String(admin.email).toLowerCase() === u) {
    if (!verifyPassword(password, admin.password))
      return res.status(401).json({ message: "Incorrect password" });
    return res.json({ token: signToken({ role: "admin" }), session: { role: "admin" } });
  }

  const student = await Student.findOne({
    $or: [{ email: new RegExp(`^${u}$`, "i") }, { roll: new RegExp(`^${u}$`, "i") }],
  }).lean();

  if (!student) return res.status(401).json({ message: "No account found for this college mail" });

  const ok = student.password
    ? verifyPassword(password, student.password)
    : password === STUDENT_DEMO_PASSWORD;
  if (!ok) return res.status(401).json({ message: "Incorrect password" });

  const studentId = String(student.id);
  return res.json({
    token: signToken({ role: "student", studentId }),
    session: { role: "student", studentId },
  });
});

/** GET /api/auth/me — who am I (validates the token). */
router.get("/me", requireAuth, async (req, res) => {
  if (req.user.role === "admin") {
    const admin = await Admin.findOne().lean();
    return res.json({ role: "admin", name: admin?.name ?? "Administrator", email: admin?.email });
  }
  const student = await Student.findOne({ id: req.user.studentId }).lean();
  if (!student) return res.status(404).json({ message: "Student not found" });
  const { _id, password, ...rest } = student;
  void _id;
  void password;
  return res.json({ role: "student", ...rest });
});

export default router;
