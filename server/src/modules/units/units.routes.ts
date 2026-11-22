import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, allowRoles } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List units
router.get("/", async (req, res, next) => {
  try {
    const propertyId = req.query.propertyId ? String(req.query.propertyId) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const q = String(req.query.q || "");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { unitCode: { contains: q } },
        { property: { name: { contains: q } } },
      ];
    }

    const units = await prisma.unit.findMany({
      where,
      orderBy: { unitCode: "asc" },
      include: {
        property: { select: { id: true, name: true, propertyCode: true } },
        currentTenant: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    res.json({ units });
  } catch (e) {
    next(e);
  }
});

// Create unit
router.post("/", allowRoles("SUPER_ADMIN", "COMPANY_ADMIN", "PROPERTY_MANAGER"), async (req, res, next) => {
  try {
    const schema = z.object({
      propertyId: z.string().min(1),
      unitCode: z.string().min(1),
      floor: z.string().optional(),
      type: z.string().default("APARTMENT"),
      areaSqFt: z.number().optional(),
      rentAmount: z.number().optional(),
      status: z.string().default("VACANT"),
      features: z.string().optional(),
      currentTenantId: z.string().nullable().optional(),
    });

    const body = schema.parse(req.body);
    const unit = await prisma.unit.create({
      data: body,
      include: { property: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "CREATE",
        module: "UNITS",
        recordId: unit.id,
        detail: `Created unit ${unit.unitCode} for property ${unit.property.name}`,
      },
    });

    res.status(201).json({ unit });
  } catch (e) {
    next(e);
  }
});

// Get single unit
router.get("/:id", async (req, res, next) => {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: String(req.params.id) },
      include: {
        property: true,
        currentTenant: true,
        leases: { orderBy: { startDate: "desc" }, take: 5 },
        serviceRequests: { orderBy: { createdAt: "desc" }, take: 5 },
        workOrders: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    if (!unit) return res.status(404).json({ message: "Unit not found" });
    res.json({ unit });
  } catch (e) {
    next(e);
  }
});

// Update unit / assign tenant
router.put("/:id", allowRoles("SUPER_ADMIN", "COMPANY_ADMIN", "PROPERTY_MANAGER"), async (req, res, next) => {
  try {
    const schema = z.object({
      unitCode: z.string().optional(),
      floor: z.string().optional(),
      type: z.string().optional(),
      areaSqFt: z.number().optional(),
      rentAmount: z.number().optional(),
      status: z.string().optional(),
      features: z.string().nullable().optional(),
      currentTenantId: z.string().nullable().optional(),
    });

    const body = schema.parse(req.body);
    const unit = await prisma.unit.update({
      where: { id: String(req.params.id) },
      data: body,
    });

    res.json({ unit });
  } catch (e) {
    next(e);
  }
});

export default router;
