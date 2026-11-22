import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List vendors
router.get("/", async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const compliance = req.query.compliance ? String(req.query.compliance) : undefined;
    const q = String(req.query.q || "");

    const where: any = {};
    if (status) where.status = status;
    if (compliance) where.complianceStatus = compliance;
    if (q) {
      where.OR = [
        { legalName: { contains: q } },
        { tradeName: { contains: q } },
        { serviceCategories: { contains: q } },
        { serviceArea: { contains: q } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { legalName: "asc" },
      include: {
        complianceDocs: true,
        contracts: true,
        _count: { select: { workOrders: true, invoices: true } },
      },
    });

    res.json({ vendors });
  } catch (e) {
    next(e);
  }
});

// Create vendor onboarding
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      legalName: z.string().min(2),
      tradeName: z.string().optional(),
      email: z.string().email(),
      phone: z.string().min(5),
      serviceCategories: z.string().min(2),
      serviceArea: z.string().min(2),
      taxId: z.string().optional(),
      bankName: z.string().optional(),
      bankAccount: z.string().optional(),
      notes: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const count = await prisma.vendor.count();
    const vendorCode = `VND-${body.legalName.slice(0, 3).toUpperCase()}-${String(count + 1).padStart(2, "0")}`;

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode,
        ...body,
      },
    });

    res.status(201).json({ vendor });
  } catch (e) {
    next(e);
  }
});

// Single vendor details
router.get("/:id", async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: String(req.params.id) },
      include: {
        complianceDocs: { orderBy: { expiryDate: "asc" } },
        contracts: true,
        workOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { property: { select: { name: true } } },
        },
        invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json({ vendor });
  } catch (e) {
    next(e);
  }
});

// Add compliance document
router.post("/:id/compliance", async (req, res, next) => {
  try {
    const schema = z.object({
      docType: z.string().min(2),
      docNumber: z.string().optional(),
      expiryDate: z.string(),
      verified: z.boolean().default(false),
    });

    const body = schema.parse(req.body);
    const doc = await prisma.vendorComplianceDoc.create({
      data: {
        vendorId: String(req.params.id),
        docType: body.docType,
        docNumber: body.docNumber,
        expiryDate: new Date(body.expiryDate),
        verified: body.verified,
        verifiedAt: body.verified ? new Date() : null,
        verifiedBy: body.verified ? req.user!.email : null,
      },
    });

    res.status(201).json({ doc });
  } catch (e) {
    next(e);
  }
});

// Verify compliance doc
router.patch("/compliance/:docId/verify", async (req, res, next) => {
  try {
    const doc = await prisma.vendorComplianceDoc.update({
      where: { id: String(req.params.docId) },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: req.user!.email,
      },
    });

    res.json({ doc });
  } catch (e) {
    next(e);
  }
});

// Vendor work queue
router.get("/:id/work-orders", async (req, res, next) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      where: { assignedVendorId: String(req.params.id) },
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { name: true, address: true } },
        unit: { select: { unitCode: true } },
      },
    });

    res.json({ workOrders });
  } catch (e) {
    next(e);
  }
});

export default router;
