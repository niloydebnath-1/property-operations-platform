import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// 1. Telephony Simulated Inbound Call Generator (SRS Section 8.3 & 10)
router.post("/telephony/simulate-call", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      callerPhone: z.string().min(5),
      callerName: z.string().optional(),
      notes: z.string().optional(),
    });

    const body = schema.parse(req.body);

    // Auto match contact
    const contact = await prisma.contact.findFirst({
      where: { phone: { contains: body.callerPhone.replace(/\D/g, "").slice(-7) } },
      include: { ownedProperties: true, tenantedUnits: true },
    });

    const count = await prisma.callLog.count();
    const callRef = `CALL-SIM-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const propertyId = contact?.tenantedUnits?.[0]?.propertyId || contact?.ownedProperties?.[0]?.id || null;

    const callLog = await prisma.callLog.create({
      data: {
        callRef,
        direction: "INBOUND",
        callerName: contact ? contact.name : body.callerName || "Simulated Caller",
        callerPhone: body.callerPhone,
        agentId: req.user!.id,
        contactId: contact ? contact.id : null,
        propertyId,
        durationSeconds: Math.floor(Math.random() * 180) + 45,
        outcome: "INFO_PROVIDED",
        notes: body.notes || "Live simulated inbound call with tenant audio recording stream.",
        recordingUrl: "/mock-audio/sample-recording.mp3",
      },
      include: { contact: true, property: true },
    });

    res.status(201).json({ success: true, callLog, matchedContact: contact ? contact.name : null });
  } catch (e) {
    next(e);
  }
});

// 2. Email Mailbox Two-Way Sync Adapter (SRS Section 8.3 & 9)
router.post("/email/sync", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const mockSyncedEmails = [
      {
        fromEmail: "tenant.inquiry@gmail.com",
        toEmail: "support@propertyops.com",
        subject: "Question about reserved parking space in Grand View Heights",
        body: "Hi operations team,\nCan you please confirm if space #14 is assigned to unit 101?\nThanks,\nTenant",
        threadId: `TH-SYNC-${Date.now().toString(36)}`,
      },
    ];

    const created = [];
    for (const em of mockSyncedEmails) {
      const existing = await prisma.emailMessage.findFirst({ where: { subject: em.subject } });
      if (!existing) {
        const item = await prisma.emailMessage.create({
          data: {
            direction: "INBOUND",
            fromEmail: em.fromEmail,
            toEmail: em.toEmail,
            subject: em.subject,
            body: em.body,
            threadId: em.threadId,
            isRead: false,
          },
        });
        created.push(item);
      }
    }

    res.json({
      message: `Mailbox sync completed successfully. Synced ${created.length} new messages.`,
      newMessages: created,
    });
  } catch (e) {
    next(e);
  }
});

// 3. Stripe Checkout Session Creator (SRS Section 8.3 & 12)
router.post("/payment/checkout-session", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      invoiceId: z.string().min(1),
    });

    const body = schema.parse(req.body);
    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      include: { contact: true, property: true },
    });

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const sessionId = `cs_test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const checkoutUrl = `/portal/checkout?session_id=${sessionId}&invoiceId=${invoice.id}&amount=${invoice.balanceDue}`;

    res.json({
      sessionId,
      checkoutUrl,
      invoiceNo: invoice.invoiceNo,
      balanceDue: Number(invoice.balanceDue),
      currency: "usd",
      customerEmail: invoice.contact?.email || "customer@example.com",
    });
  } catch (e) {
    next(e);
  }
});

export default router;
