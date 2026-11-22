import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List invoices
router.get("/invoices", async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const partyType = req.query.partyType ? String(req.query.partyType) : undefined;

    const where: any = {};
    if (status) where.status = status;
    if (partyType) where.partyType = partyType;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        contact: { select: { id: true, name: true, email: true } },
        vendor: { select: { id: true, legalName: true } },
        property: { select: { id: true, name: true } },
        workOrder: { select: { id: true, reference: true } },
        lines: true,
        payments: true,
      },
    });

    res.json({ invoices });
  } catch (e) {
    next(e);
  }
});

// Create invoice
router.post("/invoices", async (req, res, next) => {
  try {
    const schema = z.object({
      partyType: z.enum(["CLIENT", "TENANT", "OWNER", "VENDOR"]).default("CLIENT"),
      contactId: z.string().nullable().optional(),
      vendorId: z.string().nullable().optional(),
      propertyId: z.string().nullable().optional(),
      workOrderId: z.string().nullable().optional(),
      dueDate: z.string(),
      notes: z.string().optional(),
      lines: z.array(
        z.object({
          description: z.string().min(1),
          quantity: z.number().default(1),
          unitPrice: z.number().min(0),
        })
      ).min(1),
    });

    const body = schema.parse(req.body);
    const count = await prisma.invoice.count();
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const calculatedLines = body.lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: Number((l.quantity * l.unitPrice).toFixed(2)),
    }));

    const subtotal = calculatedLines.reduce((sum, l) => sum + l.amount, 0);
    const total = subtotal;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        partyType: body.partyType,
        contactId: body.contactId,
        vendorId: body.vendorId,
        propertyId: body.propertyId,
        workOrderId: body.workOrderId,
        subtotal,
        total,
        balanceDue: total,
        dueDate: new Date(body.dueDate),
        notes: body.notes,
        lines: { create: calculatedLines },
      },
      include: { lines: true, contact: true, vendor: true },
    });

    res.status(201).json({ invoice });
  } catch (e) {
    next(e);
  }
});

// Single invoice detail
router.get("/invoices/:id", async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: String(req.params.id) },
      include: {
        contact: true,
        vendor: true,
        property: true,
        workOrder: true,
        lines: true,
        payments: true,
      },
    });

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ invoice });
  } catch (e) {
    next(e);
  }
});

// Record Payment & update invoice balance (SRS 4.8)
router.post("/payments", async (req, res, next) => {
  try {
    const schema = z.object({
      invoiceId: z.string().min(1),
      amount: z.number().positive(),
      paymentMethod: z.string().default("BANK_TRANSFER"),
      referenceNotes: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const invoice = await prisma.invoice.findUnique({ where: { id: body.invoiceId } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const payCount = await prisma.payment.count();
    const paymentRef = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, "0")}`;

    const newBalance = Math.max(0, Number(invoice.balanceDue) - body.amount);
    const newStatus = newBalance <= 0 ? "PAID" : "PARTIALLY_PAID";

    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          paymentRef,
          invoiceId: invoice.id,
          amount: body.amount,
          paymentMethod: body.paymentMethod,
          status: "SUCCESS",
          referenceNotes: body.referenceNotes,
        },
      }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          balanceDue: newBalance,
          status: newStatus,
        },
      }),
    ]);

    res.status(201).json({ payment, invoice: updatedInvoice });
  } catch (e) {
    next(e);
  }
});

// List expenses
router.get("/expenses", async (req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: "desc" },
      include: {
        property: { select: { id: true, name: true } },
        workOrder: { select: { id: true, reference: true } },
        vendor: { select: { id: true, legalName: true } },
      },
    });

    res.json({ expenses });
  } catch (e) {
    next(e);
  }
});

// Create expense
router.post("/expenses", async (req, res, next) => {
  try {
    const schema = z.object({
      propertyId: z.string().min(1),
      workOrderId: z.string().nullable().optional(),
      vendorId: z.string().nullable().optional(),
      category: z.string().default("MATERIALS"),
      amount: z.number().positive(),
      description: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const expCount = await prisma.expense.count();
    const expenseRef = `EXP-${new Date().getFullYear()}-${String(expCount + 1).padStart(4, "0")}`;

    const expense = await prisma.expense.create({
      data: {
        expenseRef,
        ...body,
      },
      include: { property: true },
    });

    res.status(201).json({ expense });
  } catch (e) {
    next(e);
  }
});

export default router;
