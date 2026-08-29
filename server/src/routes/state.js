import { Router } from "express";
import {
  Admin,
  LibraryItem,
  Mark,
  Notice,
  ReadReceipt,
  Student,
  Subject,
  SyllabusDoc,
  TimetableDoc,
} from "../models.js";
import { requireAuth } from "../auth.js";

const router = Router();

const clean = (rows) =>
  rows.map((r) => {
    const { _id, password, ...rest } = r;
    void _id;
    void password;
    return rest;
  });

/** GET /api/state — full portal snapshot for the signed in user. */
router.get("/", requireAuth, async (req, res) => {
  const owner = req.user.role === "admin" ? "admin" : String(req.user.studentId);
  const [admin, students, subjects, marks, notices, library, syllabus, timetable, receipt] =
    await Promise.all([
      Admin.findOne().lean(),
      Student.find().sort({ roll: 1 }).lean(),
      Subject.find().lean(),
      Mark.find().lean(),
      Notice.find().lean(),
      LibraryItem.find().lean(),
      SyllabusDoc.find().lean(),
      TimetableDoc.find().lean(),
      ReadReceipt.findOne({ owner }).lean(),
    ]);

  const { _id, ...adminDoc } = admin ?? {};
  void _id;
  delete adminDoc.password; // never ship the password hash to the browser

  res.json({
    admin: adminDoc,
    students: clean(students),
    subjects: clean(subjects),
    marks: clean(marks),
    notices: clean(notices),
    library: clean(library),
    syllabus: clean(syllabus),
    timetable: clean(timetable),
    readNoticeIds: receipt?.noticeIds ?? [],
  });
});

/** PUT /api/state — persist changes. Students may only touch their own record. */
router.put("/", requireAuth, async (req, res) => {
  const body = req.body ?? {};
  const owner = req.user.role === "admin" ? "admin" : String(req.user.studentId);

  await ReadReceipt.findOneAndUpdate(
    { owner },
    { owner, noticeIds: body.readNoticeIds ?? [] },
    { upsert: true },
  );

  if (req.user.role === "student") {
    const mine = (body.students ?? []).find((s) => s.id === req.user.studentId);
    if (mine) {
      const { photo, phone, address, dob, gender, section, semester, name } = mine;
      await Student.findOneAndUpdate(
        { id: req.user.studentId },
        { photo, phone, address, dob, gender, section, semester, name },
      );
    }
    return res.json({ ok: true });
  }

  const replace = async (model, rows) => {
    if (!Array.isArray(rows)) return;
    await model.deleteMany({});
    if (rows.length) await model.insertMany(rows);
  };

  await Promise.all([
    replace(Student, body.students),
    replace(Subject, body.subjects),
    replace(Mark, body.marks),
    replace(Notice, body.notices),
    replace(LibraryItem, body.library),
    replace(SyllabusDoc, body.syllabus),
    replace(TimetableDoc, body.timetable),
  ]);

  if (body.admin) {
    const patch = { ...body.admin };
    delete patch.password; // password changes go through a dedicated flow
    await Admin.findOneAndUpdate({}, patch, { upsert: true });
  }

  return res.json({ ok: true });
});

export default router;
