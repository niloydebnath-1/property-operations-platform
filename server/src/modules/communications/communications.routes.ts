import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List calls
router.get("/calls", async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const direction = req.query.direction ? String(req.query.direction) : undefined;

    const where: any = {};
    if (direction) where.direction = direction;
    if (q) {
      where.OR = [
        { callerName: { contains: q } },
        { callerPhone: { contains: q } },
        { callRef: { contains: q } },
      ];
    }

    const calls = await prisma.callLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, contactType: true } },
        property: { select: { id: true, name: true } },
      },
    });

    res.json({ calls });
  } catch (e) {
    next(e);
  }
});

// Caller lookup endpoint (SRS Section 10)
router.get("/calls/lookup", async (req, res, next) => {
  try {
    const phone = String(req.query.phone || "");
    if (!phone) return res.json({ matches: [] });

    const contacts = await prisma.contact.findMany({
      where: { phone: { contains: phone } },
      include: {
        ownedProperties: { select: { id: true, name: true } },
        tenantedUnits: {
          select: { id: true, unitCode: true, property: { select: { id: true, name: true } } },
        },
        serviceRequests: {
          where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
          select: { id: true, reference: true, title: true, status: true },
        },
      },
    });

    res.json({ matches: contacts });
  } catch (e) {
    next(e);
  }
});

// Log a call
router.post("/calls", async (req, res, next) => {
  try {
    const schema = z.object({
      direction: z.enum(["INBOUND", "OUTBOUND"]).default("INBOUND"),
      callerName: z.string().optional(),
      callerPhone: z.string().min(5),
      contactId: z.string().nullable().optional(),
      propertyId: z.string().nullable().optional(),
      durationSeconds: z.number().default(0),
      outcome: z.string().default("RESOLVED"),
      notes: z.string().optional(),
      createServiceRequest: z.boolean().default(false),
      requestTitle: z.string().optional(),
      requestDescription: z.string().optional(),
      requestCategory: z.string().optional(),
      requestPriority: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const count = await prisma.callLog.count();
    const callRef = `CALL-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    let serviceRequestId: string | undefined;

    if (body.createServiceRequest && body.propertyId && body.requestTitle) {
      const srCount = await prisma.serviceRequest.count();
      const srRef = `SR-${new Date().getFullYear()}-${String(srCount + 1).padStart(3, "0")}`;
      const sr = await prisma.serviceRequest.create({
        data: {
          reference: srRef,
          title: body.requestTitle,
          description: body.requestDescription || body.notes || "Created via call log",
          category: body.requestCategory || "GENERAL",
          priority: body.requestPriority || "NORMAL",
          source: "CALL",
          propertyId: body.propertyId,
          requesterId: body.contactId,
        },
      });
      serviceRequestId = sr.id;
    }

    const call = await prisma.callLog.create({
      data: {
        callRef,
        direction: body.direction,
        callerName: body.callerName,
        callerPhone: body.callerPhone,
        agentId: req.user!.id,
        contactId: body.contactId,
        propertyId: body.propertyId,
        serviceRequestId,
        durationSeconds: body.durationSeconds,
        outcome: serviceRequestId ? "REQUEST_CREATED" : body.outcome,
        notes: body.notes,
      },
      include: { contact: true, property: true },
    });

    res.status(201).json({ call });
  } catch (e) {
    next(e);
  }
});

// Email Unified Inbox
router.get("/emails", async (req, res, next) => {
  try {
    const emails = await prisma.emailMessage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        contact: { select: { id: true, name: true } },
        property: { select: { id: true, name: true } },
      },
    });

    res.json({ emails });
  } catch (e) {
    next(e);
  }
});

// Compose & Send Email
router.post("/emails", async (req, res, next) => {
  try {
    const schema = z.object({
      toEmail: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
      contactId: z.string().nullable().optional(),
      propertyId: z.string().nullable().optional(),
      threadId: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const email = await prisma.emailMessage.create({
      data: {
        direction: "OUTBOUND",
        fromEmail: "support@propertyops.com",
        toEmail: body.toEmail,
        subject: body.subject,
        body: body.body,
        threadId: body.threadId || `TH-${Date.now().toString(36).toUpperCase()}`,
        status: "SENT",
        contactId: body.contactId,
        propertyId: body.propertyId,
        isRead: true,
      },
    });

    res.status(201).json({ email });
  } catch (e) {
    next(e);
  }
});

export default router;
