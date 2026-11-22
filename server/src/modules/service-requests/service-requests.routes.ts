import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List service requests
router.get("/", async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const priority = req.query.priority ? String(req.query.priority) : undefined;
    const propertyId = req.query.propertyId ? String(req.query.propertyId) : undefined;
    const q = String(req.query.q || "");

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (propertyId) where.propertyId = propertyId;
    if (q) {
      where.OR = [
        { reference: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true, propertyCode: true } },
        unit: { select: { id: true, unitCode: true } },
        requester: { select: { id: true, name: true, email: true, phone: true } },
        workOrders: { select: { id: true, reference: true, status: true } },
      },
    });

    res.json({ requests });
  } catch (e) {
    next(e);
  }
});

// Create service request (Portal, Call, Staff, Email)
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(3),
      description: z.string().min(5),
      category: z.string().default("GENERAL"),
      priority: z.string().default("NORMAL"),
      source: z.string().default("STAFF"),
      propertyId: z.string().min(1),
      unitId: z.string().nullable().optional(),
      requesterId: z.string().nullable().optional(),
      accessNotes: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const count = await prisma.serviceRequest.count();
    const reference = `SR-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const request = await prisma.serviceRequest.create({
      data: {
        reference,
        ...body,
      },
      include: { property: true, unit: true, requester: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "CREATE",
        module: "SERVICE_REQUESTS",
        recordId: request.id,
        detail: `Created service request ${request.reference}: ${request.title}`,
      },
    });

    res.status(201).json({ request });
  } catch (e) {
    next(e);
  }
});

// Get single request
router.get("/:id", async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: String(req.params.id) },
      include: {
        property: true,
        unit: true,
        requester: true,
        workOrders: {
          include: {
            assignedUser: { select: { name: true } },
            assignedVendor: { select: { legalName: true } },
          },
        },
      },
    });

    if (!request) return res.status(404).json({ message: "Service request not found" });
    res.json({ request });
  } catch (e) {
    next(e);
  }
});

// Triage service request (update status, reject, or info request)
router.patch("/:id/triage", async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(["UNDER_REVIEW", "AWAITING_INFO", "REJECTED", "RESOLVED", "CLOSED"]),
      priority: z.string().optional(),
      rejectedReason: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const request = await prisma.serviceRequest.update({
      where: { id: String(req.params.id) },
      data: body,
    });

    res.json({ request });
  } catch (e) {
    next(e);
  }
});

// Convert Service Request to Work Order
router.post("/:id/convert-to-work-order", async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!request) return res.status(404).json({ message: "Request not found" });

    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.string().optional(),
      category: z.string().optional(),
      estimatedCost: z.number().optional(),
      scheduledStart: z.string().optional(),
      assigneeType: z.enum(["TECHNICIAN", "VENDOR"]).optional(),
      assignedUserId: z.string().optional(),
      assignedVendorId: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const woCount = await prisma.workOrder.count();
    const reference = `WO-${new Date().getFullYear()}-${String(woCount + 1).padStart(3, "0")}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        reference,
        title: body.title || request.title,
        description: body.description || request.description,
        priority: body.priority || request.priority,
        category: body.category || request.category,
        status: body.assigneeType ? "ASSIGNED" : "APPROVED",
        propertyId: request.propertyId,
        unitId: request.unitId,
        requestId: request.id,
        createdById: req.user!.id,
        estimatedCost: body.estimatedCost,
        scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : undefined,
        assigneeType: body.assigneeType,
        assignedUserId: body.assignedUserId,
        assignedVendorId: body.assignedVendorId,
        events: {
          create: {
            fromStatus: "DRAFT",
            toStatus: body.assigneeType ? "ASSIGNED" : "APPROVED",
            actorId: req.user!.id,
            actorName: req.user!.email,
            reason: `Converted from service request ${request.reference}`,
          },
        },
      },
    });

    // Update request status
    await prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: "CONVERTED_TO_WO" },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: "CONVERT_TO_WO",
        module: "WORK_ORDERS",
        recordId: workOrder.id,
        detail: `Converted request ${request.reference} into ${workOrder.reference}`,
      },
    });

    res.status(201).json({ workOrder });
  } catch (e) {
    next(e);
  }
});

export default router;
