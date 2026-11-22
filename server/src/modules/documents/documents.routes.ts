import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();

// Configure Multer for local/cloud file storage
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

router.use(authenticate);

// 1. List documents
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category ? String(req.query.category) : undefined;
    const where: any = {};
    if (category) where.fileCategory = category;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    res.json({ documents });
  } catch (e) {
    next(e);
  }
});

// 2. Expiring documents queue (SRS Section 13)
router.get("/expiring", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000);
    const expiringVendorDocs = await prisma.vendorComplianceDoc.findMany({
      where: {
        expiryDate: { lte: thirtyDaysFromNow },
      },
      include: { vendor: { select: { id: true, legalName: true } } },
      orderBy: { expiryDate: "asc" },
    });

    const expiringGeneralDocs = await prisma.document.findMany({
      where: {
        expiryDate: { lte: thirtyDaysFromNow },
      },
      orderBy: { expiryDate: "asc" },
    });

    res.json({
      vendorDocs: expiringVendorDocs,
      generalDocs: expiringGeneralDocs,
    });
  } catch (e) {
    next(e);
  }
});

// 3. Real Multipart File Upload (SRS Section 8.3 & 13)
router.post("/upload", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided in request" });
    }

    const { entityType, entityId, fileCategory, propertyId, expiryDate } = req.body;

    const fileName = req.file.originalname;
    const fileSizeKb = Math.round(req.file.size / 1024);
    const mimeType = req.file.mimetype;
    const fileUrl = `/api/documents/raw/${req.file.filename}`;

    const doc = await prisma.document.create({
      data: {
        fileName,
        fileUrl,
        fileCategory: fileCategory || "GENERAL",
        entityType: entityType || "PROPERTY",
        entityId: entityId || "GENERAL",
        propertyId: propertyId || null,
        fileSizeKb,
        mimeType,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        uploadedBy: req.user?.email || "Staff",
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "FILE_UPLOAD",
        module: "DOCUMENTS",
        recordId: doc.id,
        detail: `Uploaded document ${doc.fileName} (${doc.fileSizeKb} KB)`,
      },
    });

    res.status(201).json({ document: doc });
  } catch (e) {
    next(e);
  }
});

// 4. Download / Stream physical file
router.get("/:id/download", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: String(req.params.id) } });
    if (!doc) return res.status(404).json({ message: "Document record not found" });

    const rawFilename = path.basename(doc.fileUrl);
    const filePath = path.join(uploadDir, rawFilename);

    if (fs.existsSync(filePath)) {
      return res.download(filePath, doc.fileName);
    }

    // Fallback if file was a sample mock url
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.fileName}"`);
    res.send(`Sample file content for ${doc.fileName} (${doc.fileCategory})`);
  } catch (e) {
    next(e);
  }
});

// Create document metadata record directly
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      fileName: z.string().min(1),
      fileUrl: z.string().default("/mock-docs/sample.pdf"),
      fileCategory: z.string().default("GENERAL"),
      entityType: z.string().default("PROPERTY"),
      entityId: z.string().min(1),
      propertyId: z.string().nullable().optional(),
      fileSizeKb: z.number().default(120),
      expiryDate: z.string().nullable().optional(),
    });

    const body = schema.parse(req.body);
    const doc = await prisma.document.create({
      data: {
        ...body,
        uploadedBy: req.user!.email,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    });

    res.status(201).json({ document: doc });
  } catch (e) {
    next(e);
  }
});

export default router;
