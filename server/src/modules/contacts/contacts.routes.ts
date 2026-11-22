import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate, allowRoles } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List contacts (Clients, Tenants, Owners)
router.get("/", async (req, res, next) => {
  try {
    const contactType = req.query.type ? String(req.query.type) : undefined;
    const q = String(req.query.q || "");

    const where: any = {};
    if (contactType) where.contactType = contactType;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { company: { contains: q } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        ownedProperties: { select: { id: true, name: true, propertyCode: true } },
        tenantedUnits: {
          select: { id: true, unitCode: true, property: { select: { name: true } } },
        },
        _count: { select: { serviceRequests: true, callLogs: true, invoices: true } },
      },
    });

    res.json({ contacts });
  } catch (e) {
    next(e);
  }
});

// Create contact
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      contactType: z.string().default("CLIENT"),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      company: z.string().optional(),
      address: z.string().optional(),
      preferredChannel: z.string().default("EMAIL"),
      notes: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const contact = await prisma.contact.create({
      data: {
        ...body,
        email: body.email || null,
      },
    });

    res.status(201).json({ contact });
  } catch (e) {
    next(e);
  }
});

// Single contact with timeline
router.get("/:id", async (req, res, next) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: String(req.params.id) },
      include: {
        ownedProperties: true,
        tenantedUnits: { include: { property: true } },
        leases: { include: { property: true, unit: true } },
        serviceRequests: { orderBy: { createdAt: "desc" }, take: 10 },
        callLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        emailMessages: { orderBy: { createdAt: "desc" }, take: 10 },
        invoices: { orderBy: { createdAt: "desc" }, take: 10 },
        supportCases: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json({ contact });
  } catch (e) {
    next(e);
  }
});

// Update contact
router.put("/:id", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      contactType: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      company: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      status: z.string().optional(),
      preferredChannel: z.string().optional(),
      notes: z.string().nullable().optional(),
    });

    const body = schema.parse(req.body);
    const contact = await prisma.contact.update({
      where: { id: String(req.params.id) },
      data: {
        ...body,
        email: body.email || null,
      },
    });

    res.json({ contact });
  } catch (e) {
    next(e);
  }
});

export default router;
