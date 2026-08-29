import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import multer from "multer";

import {
  LibraryItem,
  Mark,
  Notice,
  Student,
  Subject,
  SyllabusDoc,
  TimetableDoc,
  Upload,
} from "../models.js";

import {
  requireAuth,
  requireAdmin,
  hashPassword,
} from "../auth.js";

const router = Router();

/** Every route in this file is admin-only. */
router.use(requireAuth, requireAdmin);

/* ----------------------------- upload directory ------------------------ */

/*
 * Vercel:
 *   /tmp is the writable temporary directory.
 *
 * Local development:
 *   ./uploads
 *
 * IMPORTANT:
 * Files stored in /tmp on Vercel are temporary.
 * Permanent file storage should later use Vercel Blob,
 * Cloudinary, AWS S3, etc.
 */
export const UPLOAD_DIR =
  process.env.VERCEL === "1"
    ? "/tmp/uploads"
    : path.resolve(process.cwd(), "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ----------------------------- multer setup ----------------------------- */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.-]+/g, "_");

    cb(
      null,
      `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safe}`
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 15 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      return cb(null, true);
    }

    return cb(new Error("Only PDF files are allowed"));
  },
});

/* ------------------------------ utilities ------------------------------- */

const strip = (doc) => {
  if (!doc) return doc;

  const { _id, password, ...rest } = doc;

  void _id;
  void password;

  return rest;
};

const list = (rows) => rows.map(strip);

const newId = (prefix) =>
  `${prefix}${crypto.randomBytes(6).toString("hex")}`;

/* ------------------------------- students ------------------------------- */

router.get("/students", async (_req, res) => {
  res.json(
    list(
      await Student.find()
        .sort({ roll: 1 })
        .lean()
    )
  );
});

router.post("/students", async (req, res) => {
  const body = req.body ?? {};

  if (!body.name || !body.roll || !body.email) {
    return res.status(400).json({
      message: "name, roll and email are required",
    });
  }

  if (
    await Student.findOne({
      $or: [
        { roll: body.roll },
        { email: body.email },
      ],
    })
  ) {
    return res.status(409).json({
      message: "A student with this roll or email already exists",
    });
  }

  const doc = {
    ...body,
    id: body.id ?? newId("st"),

    ...(body.password
      ? {
          password: hashPassword(body.password),
        }
      : {}),
  };

  await Student.create(doc);

  res.status(201).json(strip(doc));
});

router.put("/students/:id", async (req, res) => {
  const body = {
    ...(req.body ?? {}),
  };

  delete body.id;

  if (body.password) {
    body.password = hashPassword(body.password);
  }

  const updated = await Student.findOneAndUpdate(
    { id: req.params.id },
    body,
    { new: true }
  ).lean();

  if (!updated) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  res.json(strip(updated));
});

router.delete("/students/:id", async (req, res) => {
  const del = await Student.findOneAndDelete({
    id: req.params.id,
  });

  if (!del) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  await Mark.deleteMany({
    studentId: req.params.id,
  });

  res.json({
    ok: true,
  });
});

/* --------------------------------- marks -------------------------------- */

router.get("/marks", async (req, res) => {
  const filter = {};

  if (req.query.studentId) {
    filter.studentId = String(req.query.studentId);
  }

  if (req.query.semester) {
    filter.semester = Number(req.query.semester);
  }

  res.json(
    list(
      await Mark.find(filter).lean()
    )
  );
});

router.post("/marks", async (req, res) => {
  const body = req.body ?? {};

  if (!body.studentId || !body.subjectCode) {
    return res.status(400).json({
      message: "studentId and subjectCode are required",
    });
  }

  const doc = {
    mid1: null,
    mid2: null,
    assignment: null,
    external: null,
    ...body,
    id: body.id ?? newId("mk"),
  };

  await Mark.create(doc);

  res.status(201).json(strip(doc));
});

/** Bulk upsert — handy for entering a whole class at once. */
router.put("/marks", async (req, res) => {
  const rows = Array.isArray(req.body?.marks)
    ? req.body.marks
    : null;

  if (!rows) {
    return res.status(400).json({
      message: "Body must be { marks: [...] }",
    });
  }

  await Promise.all(
    rows.map((m) =>
      Mark.findOneAndUpdate(
        m.id
          ? { id: m.id }
          : {
              studentId: m.studentId,
              subjectCode: m.subjectCode,
            },
        {
          ...m,
          id: m.id ?? newId("mk"),
        },
        {
          upsert: true,
        }
      )
    )
  );

  res.json({
    ok: true,
    count: rows.length,
  });
});

router.put("/marks/:id", async (req, res) => {
  const updated = await Mark.findOneAndUpdate(
    { id: req.params.id },
    req.body ?? {},
    { new: true }
  ).lean();

  if (!updated) {
    return res.status(404).json({
      message: "Mark record not found",
    });
  }

  res.json(strip(updated));
});

router.delete("/marks/:id", async (req, res) => {
  const del = await Mark.findOneAndDelete({
    id: req.params.id,
  });

  if (!del) {
    return res.status(404).json({
      message: "Mark record not found",
    });
  }

  res.json({
    ok: true,
  });
});

/* ------------------------------- subjects ------------------------------- */

router.get("/subjects", async (_req, res) => {
  res.json(
    list(
      await Subject.find().lean()
    )
  );
});

router.post("/subjects", async (req, res) => {
  const body = req.body ?? {};

  if (!body.code || !body.name) {
    return res.status(400).json({
      message: "code and name are required",
    });
  }

  await Subject.findOneAndUpdate(
    { code: body.code },
    body,
    { upsert: true }
  );

  res.status(201).json(body);
});

router.delete("/subjects/:code", async (req, res) => {
  await Subject.deleteOne({
    code: req.params.code,
  });

  res.json({
    ok: true,
  });
});

/* ------------------------------ timetables ------------------------------ */

router.get("/timetables", async (_req, res) => {
  res.json(
    list(
      await TimetableDoc.find().lean()
    )
  );
});

router.post(
  "/timetables",
  upload.single("file"),
  async (req, res) => {
    const {
      title,
      branch,
      section,
      semester,
    } = req.body ?? {};

    if (!branch || !section) {
      return res.status(400).json({
        message: "branch and section are required",
      });
    }

    const id = newId("tt");

    const doc = {
      id,

      title:
        title ||
        `${branch} ${section} Timetable`,

      branch,
      section,

      semester:
        Number(semester) || undefined,

      fileName:
        req.file?.originalname ?? "",

      url:
        req.file
          ? `/uploads/${req.file.filename}`
          : undefined,

      size:
        req.file?.size ?? 0,

      uploadedAt:
        new Date().toISOString(),
    };

    await TimetableDoc.create(doc);

    if (req.file) {
      await Upload.create({
        ...doc,
        kind: "timetable",
        storedName: req.file.filename,
        uploadedBy: "admin",
      });
    }

    res.status(201).json(doc);
  }
);

router.put("/timetables/:id", async (req, res) => {
  const updated =
    await TimetableDoc.findOneAndUpdate(
      { id: req.params.id },
      req.body ?? {},
      {
        new: true,
      }
    ).lean();

  if (!updated) {
    return res.status(404).json({
      message: "Timetable not found",
    });
  }

  res.json(strip(updated));
});

router.delete("/timetables/:id", async (req, res) => {
  const del =
    await TimetableDoc.findOneAndDelete({
      id: req.params.id,
    }).lean();

  if (!del) {
    return res.status(404).json({
      message: "Timetable not found",
    });
  }

  await removeFileFor(req.params.id);

  res.json({
    ok: true,
  });
});

/* -------------------------------- uploads ------------------------------- */

/**
 * POST /api/admin/uploads
 *
 * Multipart PDF upload:
 * syllabus / library / notice attachments
 */
router.post(
  "/uploads",
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "A PDF file is required",
      });
    }

    const {
      kind = "library",
      title,
      branch,
      section,
      semester,
    } = req.body ?? {};

    const doc = {
      id: newId("up"),

      kind,

      title:
        title ||
        req.file.originalname,

      fileName:
        req.file.originalname,

      storedName:
        req.file.filename,

      url:
        `/uploads/${req.file.filename}`,

      size:
        req.file.size,

      branch,

      section,

      semester:
        semester
          ? Number(semester)
          : undefined,

      uploadedBy: "admin",

      uploadedAt:
        new Date().toISOString(),
    };

    await Upload.create(doc);

    const mirror = {
      ...doc,
    };

    delete mirror.kind;
    delete mirror.storedName;

    if (kind === "syllabus") {
      await SyllabusDoc.create(mirror);
    }

    if (kind === "library") {
      await LibraryItem.create(mirror);
    }

    if (kind === "notice") {
      await Notice.create(mirror);
    }

    res.status(201).json(doc);
  }
);

router.get("/uploads", async (req, res) => {
  const filter = req.query.kind
    ? {
        kind: String(req.query.kind),
      }
    : {};

  res.json(
    list(
      await Upload.find(filter)
        .sort({ uploadedAt: -1 })
        .lean()
    )
  );
});

router.delete("/uploads/:id", async (req, res) => {
  const doc =
    await Upload.findOneAndDelete({
      id: req.params.id,
    }).lean();

  if (!doc) {
    return res.status(404).json({
      message: "Upload not found",
    });
  }

  if (doc.storedName) {
    const filePath = path.join(
      UPLOAD_DIR,
      doc.storedName
    );

    fs.rmSync(filePath, {
      force: true,
    });
  }

  await Promise.all([
    SyllabusDoc.deleteOne({
      id: doc.id,
    }),

    LibraryItem.deleteOne({
      id: doc.id,
    }),

    Notice.deleteOne({
      id: doc.id,
    }),
  ]);

  res.json({
    ok: true,
  });
});

/* ----------------------------- file cleanup ----------------------------- */

async function removeFileFor(id) {
  const up =
    await Upload.findOneAndDelete({
      id,
    }).lean();

  if (up?.storedName) {
    const filePath = path.join(
      UPLOAD_DIR,
      up.storedName
    );

    fs.rmSync(filePath, {
      force: true,
    });
  }
}

/* ------------------------------ error guard ----------------------------- */

router.use((err, _req, res, _next) => {
  console.error(err);

  res.status(400).json({
    message:
      err.message ??
      "Request failed",
  });
});

export default router;