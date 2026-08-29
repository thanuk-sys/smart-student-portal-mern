import {
  DEFAULT_ADMIN,
  SEED_LIBRARY,
  SEED_NOTICES,
  SEED_SYLLABUS,
  SEED_TIMETABLE,
  STUDENT_DEMO_PASSWORD,
  buildMarks,
  buildStudents,
  buildSubjects,
} from "./data.js";
import {
  Admin,
  LibraryItem,
  Mark,
  Notice,
  Student,
  Subject,
  SyllabusDoc,
  TimetableDoc,
} from "./models.js";
import { hashPassword } from "./auth.js";

/** Populates MongoDB with demo data when the database is empty. */
export async function seedIfEmpty(force = false) {
  const count = await Student.countDocuments();
  if (count > 0 && !force) return false;

  await Promise.all([
    Admin.deleteMany({}),
    Student.deleteMany({}),
    Subject.deleteMany({}),
    Mark.deleteMany({}),
    Notice.deleteMany({}),
    LibraryItem.deleteMany({}),
    SyllabusDoc.deleteMany({}),
    TimetableDoc.deleteMany({}),
  ]);

  const students = buildStudents();
  const subjects = buildSubjects();
  const studentHash = hashPassword(STUDENT_DEMO_PASSWORD);

  await Admin.create({ ...DEFAULT_ADMIN, password: hashPassword(DEFAULT_ADMIN.password) });
  await Student.insertMany(students.map((s) => ({ ...s, password: studentHash })));
  await Subject.insertMany(subjects);
  await Mark.insertMany(buildMarks(students, subjects));
  await Notice.insertMany(SEED_NOTICES);
  await LibraryItem.insertMany(SEED_LIBRARY);
  await SyllabusDoc.insertMany(SEED_SYLLABUS);
  await TimetableDoc.insertMany(SEED_TIMETABLE);

  console.log(`Seeded ${students.length} students and ${subjects.length} subjects`);
  return true;
}
