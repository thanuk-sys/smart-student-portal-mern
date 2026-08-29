import mongoose, { Schema } from "mongoose";

/** Documents mirror the client payload exactly, so schemas are intentionally loose. */
const loose = () =>
  new Schema({ id: { type: String, index: true } }, { strict: false, versionKey: false, id: false });

export const Admin = mongoose.model("Admin", loose());
export const Student = mongoose.model("Student", loose());
export const Subject = mongoose.model("Subject", loose());
export const Mark = mongoose.model("Mark", loose());
export const Notice = mongoose.model("Notice", loose());
export const LibraryItem = mongoose.model("LibraryItem", loose());
export const SyllabusDoc = mongoose.model("SyllabusDoc", loose());
export const TimetableDoc = mongoose.model("TimetableDoc", loose());

/** Metadata for PDFs stored on disk under server/uploads. */
export const Upload = mongoose.model(
  "Upload",
  new Schema(
    {
      id: { type: String, index: true },
      kind: { type: String, enum: ["timetable", "syllabus", "library", "notice"], default: "library" },
      title: String,
      fileName: String,
      storedName: String,
      url: String,
      size: Number,
      branch: String,
      section: String,
      semester: Number,
      uploadedBy: String,
      uploadedAt: { type: String, default: () => new Date().toISOString() },
    },
    { versionKey: false },
  ),
);

export const ReadReceipt = mongoose.model(
  "ReadReceipt",
  new Schema({ owner: String, noticeIds: [String] }, { versionKey: false }),
);
