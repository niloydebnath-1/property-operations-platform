import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// Work order state machine definitions per SRS 4.3
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["UNDER_REVIEW", "PENDING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["AWAITING_INFO", "PENDING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"],
  AWAITING_INFO: ["UNDER_REVIEW", "PENDING_APPROVAL", "APPROVED", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["ASSIGNED", "SCHEDULED", "IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  REJECTED: ["UNDER_REVIEW", "CANCELLED"],
  ASSIGNED: ["SCHEDULED", "IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["IN_PROGRESS", "ASSIGNED", "CANCELLED"],
  COMPLETED: ["PENDING_VERIFICATION", "VERIFIED", "IN_PROGRESS", "CLOSED"],
  PENDING_VERIFICATION: ["VERIFIED", "IN_PROGRESS", "CLOSED"],
  VERIFIED: ["CLOSED"],
  CLOSED: ["UNDER_REVIEW"], // Reopen
  CANCELLED: [],
};

// List work orders
router.get("/", async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const priority = req.query.priority ? String(req.query.priority) : undefined;
    const propertyId = req.query.propertyId ? String(req.query.propertyId) : undefined;
    const assigneeType = req.query.assigneeType ? String(req.query.assigneeType) : undefined;
    const q = String(req.query.q || "");

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (propertyId) where.propertyId = propertyId;
    if (assigneeType) where.assigneeType = assigneeType;
    if (q) {
      where.OR = [
        { reference: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { property: { name: { contains: q } } },
      ];
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true, propertyCode: true } },
        unit: { select: { id: true, unitCode: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
        assignedVendor: { select: { id: true, legalName: true, phone: true } },
        checklists: true,
      },
    });

    res.json({ workOrders });
  } catch (e) {
    next(e);
  }
});

// Kanban board view
router.get("/board", async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const status = req.query.status ? String(req.query.status) : undefined;
    const priority = req.query.priority ? String(req.query.priority) : undefined;

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (q) {
      where.OR = [
        { reference: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { property: { name: { contains: q } } },
      ];
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      orderBy: { priority: "desc" },
      include: {
        property: { select: { name: true } },
        unit: { select: { unitCode: true } },
        assignedUser: { select: { name: true } },
        assignedVendor: { select: { legalName: true } },
      },
    });

    const columns: Record<string, any[]> = {
      SUBMITTED: [],
      APPROVED: [],
      ASSIGNED: [],
      IN_PROGRESS: [],
      ON_HOLD: [],
      COMPLETED: [],
      CLOSED: [],
    };

    for (const wo of workOrders) {
      if (columns[wo.status]) {
        columns[wo.status].push(wo);
      }
      // Also map friendly multi-state groupings
      if (wo.status === "PENDING_APPROVAL" || wo.status === "UNDER_REVIEW" || wo.status === "DRAFT") {
        if (!columns.SUBMITTED.some((x) => x.id === wo.id)) columns.SUBMITTED.push(wo);
      } else if (wo.status === "SCHEDULED" || wo.status === "ASSIGNED") {
        if (!columns.APPROVED.some((x) => x.id === wo.id)) columns.APPROVED.push(wo);
      } else if (wo.status === "ON_HOLD") {
        if (!columns.IN_PROGRESS.some((x) => x.id === wo.id)) columns.IN_PROGRESS.push(wo);
      } else if (wo.status === "PENDING_VERIFICATION" || wo.status === "VERIFIED" || wo.status === "CLOSED") {
        if (!columns.COMPLETED.some((x) => x.id === wo.id)) columns.COMPLETED.push(wo);
      }
    }

    res.json({ columns });
  } catch (e) {
    next(e);
  }
});

// Create work order
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      description: z.string().min(5),
      category: z.string().default("GENERAL"),
      priority: z.string().default("NORMAL"),
      propertyId: z.string().min(1),
      unitId: z.string().nullable().optional(),
      assetId: z.string().nullable().optional(),
      estimatedCost: z.number().optional(),
      scheduledStart: z.string().optional(),
      scheduledEnd: z.string().optional(),
      assigneeType: z.enum(["TECHNICIAN", "VENDOR"]).nullable().optional(),
      assignedUserId: z.string().nullable().optional(),
      assignedVendorId: z.string().nullable().optional(),
    });

    const body = schema.parse(req.body);
    const count = await prisma.workOrder.count();
    const reference = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const initialStatus = body.priority === "EMERGENCY" ? "APPROVED" : "SUBMITTED";

    const workOrder = await prisma.workOrder.create({
      data: {
        reference,
        ...body,
        status: body.assigneeType ? "ASSIGNED" : initialStatus,
        createdById: req.user!.id,
        scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : undefined,
        scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : undefined,
        events: {
          create: {
            fromStatus: "DRAFT",
            toStatus: body.assigneeType ? "ASSIGNED" : initialStatus,
            actorId: req.user!.id,
            actorName: req.user!.email,
            reason: "Work order created",
          },
        },
      },
      include: { property: true, unit: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "CREATE",
        module: "WORK_ORDERS",
        recordId: workOrder.id,
        detail: `Created work order ${workOrder.reference}: ${workOrder.title}`,
      },
    });

    res.status(201).json({ workOrder });
  } catch (e) {
    next(e);
  }
});

// Get single work order with all relations and history
router.get("/:id", async (req, res, next) => {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: String(req.params.id) },
      include: {
        property: true,
        unit: true,
        asset: true,
        serviceRequest: true,
        assignedUser: true,
        assignedVendor: { include: { complianceDocs: true } },
        checklists: true,
        events: { orderBy: { createdAt: "desc" } },
        assignments: { orderBy: { createdAt: "desc" } },
        expenses: true,
        invoices: true,
      },
    });

    if (!workOrder) return res.status(404).json({ message: "Work order not found" });

    // Permitted next states from current status
    const permittedTransitions = ALLOWED_TRANSITIONS[workOrder.status] || [];

    res.json({ workOrder, permittedTransitions });
  } catch (e) {
    next(e);
  }
});

// State machine transition endpoint
router.post("/:id/transitions", async (req, res, next) => {
  try {
    const schema = z.object({
      toStatus: z.string(),
      reason: z.string().min(2),
      actualCost: z.number().optional(),
      closureSummary: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const existing = await prisma.workOrder.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) return res.status(404).json({ message: "Work order not found" });

    const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(body.toStatus) && req.user!.role !== "SUPER_ADMIN") {
      return res.status(400).json({
        message: `Invalid state transition from ${existing.status} to ${body.toStatus}. Allowed: ${allowed.join(", ")}`,
      });
    }

    const updateData: any = {
      status: body.toStatus,
    };
    if (body.actualCost !== undefined) updateData.actualCost = body.actualCost;
    if (body.closureSummary) updateData.closureSummary = body.closureSummary;
    if (body.toStatus === "COMPLETED") updateData.completedAt = new Date();
    if (body.toStatus === "VERIFIED") updateData.verifiedAt = new Date();
    if (body.toStatus === "CLOSED") updateData.closedAt = new Date();

    const [updated] = await prisma.$transaction([
      prisma.workOrder.update({
        where: { id: existing.id },
        data: updateData,
      }),
      prisma.workOrderEvent.create({
        data: {
          workOrderId: existing.id,
          fromStatus: existing.status,
          toStatus: body.toStatus,
          actorId: req.user!.id,
          actorName: req.user!.email,
          reason: body.reason,
          detail: body.closureSummary,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: req.user!.id,
          action: "STATUS_TRANSITION",
          module: "WORK_ORDERS",
          recordId: existing.id,
          detail: `${existing.reference} transitioned ${existing.status} -> ${body.toStatus}`,
        },
      }),
    ]);

    res.json({ workOrder: updated });
  } catch (e) {
    next(e);
  }
});

// Assign resource (technician or vendor)
router.post("/:id/assignments", async (req, res, next) => {
  try {
    const schema = z.object({
      assigneeType: z.enum(["TECHNICIAN", "VENDOR"]),
      assigneeId: z.string().min(1),
      assigneeName: z.string().min(1),
    });

    const body = schema.parse(req.body);
    const wo = await prisma.workOrder.findUnique({ where: { id: String(req.params.id) } });
    if (!wo) return res.status(404).json({ message: "Work order not found" });

    // If vendor, check compliance
    if (body.assigneeType === "VENDOR") {
      const vendor = await prisma.vendor.findUnique({
        where: { id: body.assigneeId },
        include: { complianceDocs: true },
      });
      if (vendor?.complianceStatus === "NON_COMPLIANT") {
        return res.status(400).json({ message: "Cannot assign non-compliant vendor" });
      }
    }

    const [updated] = await prisma.$transaction([
      prisma.workOrder.update({
        where: { id: wo.id },
        data: {
          assigneeType: body.assigneeType,
          assignedUserId: body.assigneeType === "TECHNICIAN" ? body.assigneeId : null,
          assignedVendorId: body.assigneeType === "VENDOR" ? body.assigneeId : null,
          status: wo.status === "DRAFT" || wo.status === "SUBMITTED" ? "ASSIGNED" : wo.status,
        },
      }),
      prisma.workOrderAssignment.create({
        data: {
          workOrderId: wo.id,
          assigneeType: body.assigneeType,
          assigneeId: body.assigneeId,
          assigneeName: body.assigneeName,
          status: "ASSIGNED",
        },
      }),
      prisma.workOrderEvent.create({
        data: {
          workOrderId: wo.id,
          fromStatus: wo.status,
          toStatus: "ASSIGNED",
          actorId: req.user!.id,
          actorName: req.user!.email,
          reason: `Assigned to ${body.assigneeType}: ${body.assigneeName}`,
        },
      }),
    ]);

    res.json({ workOrder: updated });
  } catch (e) {
    next(e);
  }
});

// Add / Toggle checklist item
router.post("/:id/checklist", async (req, res, next) => {
  try {
    const schema = z.object({
      task: z.string().min(2),
    });

    const body = schema.parse(req.body);
    const item = await prisma.workOrderChecklist.create({
      data: {
        workOrderId: String(req.params.id),
        task: body.task,
      },
    });

    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});

router.patch("/checklist/:checklistId/toggle", async (req, res, next) => {
  try {
    const item = await prisma.workOrderChecklist.findUnique({ where: { id: String(req.params.checklistId) } });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const updated = await prisma.workOrderChecklist.update({
      where: { id: item.id },
      data: {
        isCompleted: !item.isCompleted,
        completedAt: !item.isCompleted ? new Date() : null,
        completedBy: !item.isCompleted ? req.user!.email : null,
      },
    });

    res.json({ item: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
