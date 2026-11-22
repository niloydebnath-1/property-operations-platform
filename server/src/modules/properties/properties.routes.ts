import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, allowRoles } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List properties with filters
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const status = req.query.status ? String(req.query.status) : undefined;
    const type = req.query.type ? String(req.query.type) : undefined;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { propertyCode: { contains: q } },
        { address: { contains: q } },
        { city: { contains: q } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true, phone: true } },
        _count: {
          select: { units: true, workOrders: true, assets: true, inspections: true },
        },
      },
    });

    res.json({ properties });
  } catch (e) {
    next(e);
  }
});

// Create property
router.post("/", allowRoles("SUPER_ADMIN", "COMPANY_ADMIN", "PROPERTY_MANAGER"), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      propertyCode: z.string().min(2),
      type: z.string().default("RESIDENTIAL"),
      address: z.string().min(5),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      timezone: z.string().default("UTC"),
      managerId: z.string().optional(),
      ownerId: z.string().optional(),
      notes: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const prop = await prisma.property.create({
      data: {
        ...body,
        managerId: body.managerId || req.user!.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "CREATE",
        module: "PROPERTIES",
        recordId: prop.id,
        detail: `Created property ${prop.name} (${prop.propertyCode})`,
      },
    });

    res.status(201).json({ property: prop });
  } catch (e) {
    next(e);
  }
});

// Single property details with tabs
router.get("/:id", async (req, res, next) => {
  try {
    const prop = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
      include: {
        manager: { select: { id: true, name: true, email: true, phone: true } },
        owner: { select: { id: true, name: true, email: true, phone: true, company: true } },
        units: {
          include: { currentTenant: { select: { id: true, name: true, phone: true, email: true } } },
        },
        assets: true,
        workOrders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            assignedUser: { select: { name: true } },
            assignedVendor: { select: { legalName: true } },
          },
        },
        inspections: {
          take: 10,
          orderBy: { scheduledAt: "desc" },
        },
        documents: true,
        _count: {
          select: { units: true, workOrders: true, assets: true, expenses: true },
        },
      },
    });

    if (!prop) return res.status(404).json({ message: "Property not found" });
    res.json({ property: prop });
  } catch (e) {
    next(e);
  }
});

// Update property
router.put("/:id", allowRoles("SUPER_ADMIN", "COMPANY_ADMIN", "PROPERTY_MANAGER"), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      type: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      status: z.string().optional(),
      managerId: z.string().nullable().optional(),
      ownerId: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    });

    const body = schema.parse(req.body);
    const prop = await prisma.property.update({
      where: { id: String(req.params.id) },
      data: body,
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "UPDATE",
        module: "PROPERTIES",
        recordId: prop.id,
        detail: `Updated property ${prop.name}`,
      },
    });

    res.json({ property: prop });
  } catch (e) {
    next(e);
  }
});

// Delete / Archive property
router.delete("/:id", allowRoles("SUPER_ADMIN", "COMPANY_ADMIN"), async (req, res, next) => {
  try {
    const prop = await prisma.property.update({
      where: { id: String(req.params.id) },
      data: { status: "INACTIVE" },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "ARCHIVE",
        module: "PROPERTIES",
        recordId: prop.id,
        detail: `Archived property ${prop.name}`,
      },
    });

    res.json({ message: "Property archived successfully" });
  } catch (e) {
    next(e);
  }
});

export default router;
