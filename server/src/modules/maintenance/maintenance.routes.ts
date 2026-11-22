import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List assets
router.get("/assets", async (req, res, next) => {
  try {
    const propertyId = req.query.propertyId ? String(req.query.propertyId) : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const q = String(req.query.q || "");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { assetCode: { contains: q } },
        { serialNo: { contains: q } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true, propertyCode: true } },
        unit: { select: { id: true, unitCode: true } },
        _count: { select: { workOrders: true, maintenancePlans: true } },
      },
    });

    res.json({ assets });
  } catch (e) {
    next(e);
  }
});

// Create asset
router.post("/assets", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      category: z.string().min(2),
      propertyId: z.string().min(1),
      unitId: z.string().nullable().optional(),
      serialNo: z.string().optional(),
      modelNo: z.string().optional(),
      manufacturer: z.string().optional(),
      condition: z.string().default("GOOD"),
      status: z.string().default("OPERATIONAL"),
      notes: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const count = await prisma.asset.count();
    const assetCode = `AST-${body.category.slice(0, 4).toUpperCase()}-${String(count + 1).padStart(3, "0")}`;

    const asset = await prisma.asset.create({
      data: {
        assetCode,
        ...body,
      },
      include: { property: true },
    });

    res.status(201).json({ asset });
  } catch (e) {
    next(e);
  }
});

// List maintenance plans
router.get("/plans", async (req, res, next) => {
  try {
    const plans = await prisma.maintenancePlan.findMany({
      orderBy: { nextDue: "asc" },
      include: {
        property: { select: { id: true, name: true } },
        asset: { select: { id: true, name: true, assetCode: true } },
      },
    });

    res.json({ plans });
  } catch (e) {
    next(e);
  }
});

// Create maintenance plan
router.post("/plans", async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      propertyId: z.string().min(1),
      assetId: z.string().nullable().optional(),
      frequency: z.string().default("MONTHLY"),
      recurrenceRule: z.string().optional(),
      nextDue: z.string(),
      assignedTeam: z.string().optional(),
      estimatedCost: z.number().optional(),
      description: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const plan = await prisma.maintenancePlan.create({
      data: {
        ...body,
        nextDue: new Date(body.nextDue),
      },
      include: { property: true, asset: true },
    });

    res.status(201).json({ plan });
  } catch (e) {
    next(e);
  }
});

// Auto-generate Work Orders from Due Maintenance Plans (Idempotent per WF-05)
router.post("/plans/generate", async (req, res, next) => {
  try {
    const thresholdDate = new Date(Date.now() + 7 * 86400000); // due within next 7 days
    const duePlans = await prisma.maintenancePlan.findMany({
      where: {
        active: true,
        nextDue: { lte: thresholdDate },
      },
      include: { property: true, asset: true },
    });

    const generatedWorkOrders = [];

    for (const plan of duePlans) {
      const count = await prisma.workOrder.count();
      const reference = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

      const wo = await prisma.workOrder.create({
        data: {
          reference,
          title: `[PM] ${plan.title}`,
          description: `Auto-generated scheduled preventive maintenance for ${plan.asset?.name || plan.property.name}. Frequency: ${plan.frequency}`,
          category: plan.asset?.category || "MAINTENANCE",
          priority: "NORMAL",
          status: "APPROVED",
          propertyId: plan.propertyId,
          assetId: plan.assetId,
          estimatedCost: plan.estimatedCost,
          scheduledStart: plan.nextDue,
          createdById: req.user!.id,
          events: {
            create: {
              fromStatus: "DRAFT",
              toStatus: "APPROVED",
              actorId: req.user!.id,
              actorName: "System PM Engine",
              reason: `Generated from Maintenance Plan: ${plan.title}`,
            },
          },
        },
      });

      // Update next due date based on frequency
      let nextDueDate = new Date(plan.nextDue);
      if (plan.frequency === "DAILY") nextDueDate.setDate(nextDueDate.getDate() + 1);
      else if (plan.frequency === "WEEKLY") nextDueDate.setDate(nextDueDate.getDate() + 7);
      else if (plan.frequency === "MONTHLY") nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      else if (plan.frequency === "QUARTERLY") nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      else if (plan.frequency === "ANNUAL") nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      else nextDueDate.setMonth(nextDueDate.getMonth() + 1);

      await prisma.maintenancePlan.update({
        where: { id: plan.id },
        data: {
          lastRunAt: new Date(),
          nextDue: nextDueDate,
        },
      });

      generatedWorkOrders.push(wo);
    }

    res.json({
      message: `Generated ${generatedWorkOrders.length} work orders from due maintenance plans`,
      generated: generatedWorkOrders,
    });
  } catch (e) {
    next(e);
  }
});

// Inspections
router.get("/inspections", async (req, res, next) => {
  try {
    const inspections = await prisma.inspection.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitCode: true } },
        inspector: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ inspections });
  } catch (e) {
    next(e);
  }
});

router.post("/inspections", async (req, res, next) => {
  try {
    const schema = z.object({
      propertyId: z.string().min(1),
      unitId: z.string().nullable().optional(),
      type: z.string().default("ROUTINE"),
      scheduledAt: z.string(),
      findings: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const count = await prisma.inspection.count();
    const inspectionCode = `INSP-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const inspection = await prisma.inspection.create({
      data: {
        inspectionCode,
        ...body,
        scheduledAt: new Date(body.scheduledAt),
        inspectorId: req.user!.id,
      },
      include: { property: true },
    });

    res.status(201).json({ inspection });
  } catch (e) {
    next(e);
  }
});

export default router;
