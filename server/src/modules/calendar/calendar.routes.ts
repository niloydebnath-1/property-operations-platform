import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List unified calendar events (CalendarEvents, Scheduled Work Orders, Inspections, and PM Plans)
router.get("/", async (req, res, next) => {
  try {
    const [dbEvents, workOrders, inspections, pmPlans] = await Promise.all([
      // 1. Direct Calendar Appointments
      prisma.calendarEvent.findMany({
        orderBy: { startAt: "asc" },
        include: {
          workOrder: { select: { id: true, reference: true, status: true, priority: true } },
        },
      }),

      // 2. Scheduled Work Orders
      prisma.workOrder.findMany({
        where: {
          status: { notIn: ["CANCELLED"] },
        },
        include: {
          property: { select: { name: true } },
          unit: { select: { unitCode: true } },
          assignedUser: { select: { name: true } },
          assignedVendor: { select: { legalName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),

      // 3. Inspections
      prisma.inspection.findMany({
        include: {
          property: { select: { name: true } },
          unit: { select: { unitCode: true } },
          inspector: { select: { name: true } },
        },
        orderBy: { scheduledAt: "asc" },
      }),

      // 4. Preventive Maintenance Plans
      prisma.maintenancePlan.findMany({
        where: { active: true },
        include: {
          property: { select: { name: true } },
          asset: { select: { name: true, assetCode: true } },
        },
        orderBy: { nextDue: "asc" },
      }),
    ]);

    // Format all operational schedules into a unified event format
    const unifiedEvents: any[] = [...dbEvents];

    // Map Work Orders
    for (const wo of workOrders) {
      const start = wo.scheduledStart || wo.createdAt;
      const end = wo.scheduledEnd || new Date(new Date(start).getTime() + 2 * 3600000);
      const isAlreadyInDb = dbEvents.some((e) => e.workOrderId === wo.id);
      if (!isAlreadyInDb) {
        unifiedEvents.push({
          id: `wo-${wo.id}`,
          title: `${wo.reference}: ${wo.title}`,
          eventType: "WORK_ORDER",
          startAt: start,
          endAt: end,
          workOrderId: wo.id,
          priority: wo.priority,
          status: wo.status,
          assignee: wo.assignedUser?.name || wo.assignedVendor?.legalName || "Unassigned",
          location: `${wo.property?.name || "Portfolio"}${wo.unit ? ` · ${wo.unit.unitCode}` : ""}`,
          description: wo.description,
        });
      }
    }

    // Map Inspections
    for (const insp of inspections) {
      const start = insp.scheduledAt;
      const end = new Date(new Date(start).getTime() + 1.5 * 3600000);
      unifiedEvents.push({
        id: `insp-${insp.id}`,
        title: `Inspection: ${insp.inspectionCode} (${insp.type})`,
        eventType: "INSPECTION",
        startAt: start,
        endAt: end,
        status: insp.status,
        assignee: insp.inspector?.name || "Operations Inspector",
        location: `${insp.property?.name || "Property"}${insp.unit ? ` · Unit ${insp.unit.unitCode}` : ""}`,
        description: `Scheduled ${insp.type} site inspection. Status: ${insp.status}`,
      });
    }

    // Map PM Plans
    for (const pm of pmPlans) {
      const start = pm.nextDue;
      const end = new Date(new Date(start).getTime() + 3 * 3600000);
      unifiedEvents.push({
        id: `pm-${pm.id}`,
        title: `[PM] ${pm.title}`,
        eventType: "PREVENTIVE",
        startAt: start,
        endAt: end,
        status: "SCHEDULED",
        assignee: pm.assignedTeam || "Maintenance Team",
        location: `${pm.property?.name || "Facility"}${pm.asset ? ` · ${pm.asset.name}` : ""}`,
        description: `Automated recurring preventive maintenance plan (${pm.frequency}).`,
      });
    }

    // Sort descending so newest / latest appointments appear at the top
    unifiedEvents.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    res.json({ events: unifiedEvents });
  } catch (e) {
    next(e);
  }
});

// Create calendar event
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(2),
      eventType: z.string().default("APPOINTMENT"),
      startAt: z.string(),
      endAt: z.string(),
      workOrderId: z.string().nullable().optional(),
      assignee: z.string().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const event = await prisma.calendarEvent.create({
      data: {
        ...body,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
      },
    });

    res.status(201).json({ event });
  } catch (e) {
    next(e);
  }
});

export default router;
