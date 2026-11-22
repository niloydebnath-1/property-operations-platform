import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

const router = Router();

// 1. Stripe Payment Webhook (SRS Section 8.3 & 12)
router.post("/stripe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.body;
    console.log(`[Stripe Webhook] Received event: ${event.type || "unknown"}`);

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const session = event.data?.object || event;
      const invoiceNo = session.client_reference_id || session.metadata?.invoiceNo;
      const invoiceId = session.metadata?.invoiceId;

      let invoice = null;
      if (invoiceNo) {
        invoice = await prisma.invoice.findUnique({ where: { invoiceNo } });
      } else if (invoiceId) {
        invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      }

      if (invoice) {
        const rawAmount = session.amount_total ? session.amount_total / 100 : session.amount || Number(invoice.balanceDue);
        const paidAmount = Number(rawAmount);

        const payCount = await prisma.payment.count();
        const paymentRef = `PAY-STRIPE-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, "0")}`;

        const newBalance = Math.max(0, Number(invoice.balanceDue) - paidAmount);
        const newStatus = newBalance <= 0 ? "PAID" : "PARTIALLY_PAID";

        const systemUser = await prisma.user.findFirst();
        await prisma.$transaction([
          prisma.payment.create({
            data: {
              paymentRef,
              invoiceId: invoice.id,
              amount: paidAmount,
              paymentMethod: "ONLINE",
              status: "SUCCESS",
              referenceNotes: `Stripe Checkout session ${session.id || "live"}`,
            },
          }),
          prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              balanceDue: newBalance,
              status: newStatus,
            },
          }),
          prisma.activityLog.create({
            data: {
              userId: systemUser ? systemUser.id : invoice.id,
              action: "ONLINE_PAYMENT",
              module: "FINANCE",
              recordId: invoice.id,
              detail: `Stripe webhook confirmed payment of $${paidAmount.toFixed(2)} for ${invoice.invoiceNo}`,
            },
          }),
        ]);

        return res.json({ received: true, invoiceNo: invoice.invoiceNo, status: newStatus });
      }
    }

    res.json({ received: true, message: "Unhandled event processed" });
  } catch (e) {
    next(e);
  }
});

// 2. Twilio Telephony Inbound Call Webhook (SRS Section 8.3 & 10)
router.post("/twilio/voice", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const callerPhone = req.body.From || req.body.caller || "+1 (555) 999-0000";
    const callerName = req.body.CallerName || req.body.callerName || "Inbound Caller";
    const callSid = req.body.CallSid || `CA-${Date.now().toString(36)}`;
    const recordingUrl = req.body.RecordingUrl || null;
    const duration = Number(req.body.CallDuration || req.body.duration || 65);

    // Auto-match contact by phone
    const contact = await prisma.contact.findFirst({
      where: { phone: { contains: callerPhone.replace(/\D/g, "").slice(-7) } },
      include: { ownedProperties: true, tenantedUnits: { include: { property: true } } },
    });

    let propertyId = null;
    if (contact?.tenantedUnits?.length) {
      propertyId = contact.tenantedUnits[0].propertyId;
    } else if (contact?.ownedProperties?.length) {
      propertyId = contact.ownedProperties[0].id;
    }

    const count = await prisma.callLog.count();
    const callRef = `CALL-TWILIO-${String(count + 1).padStart(4, "0")}`;

    const callLog = await prisma.callLog.create({
      data: {
        callRef,
        direction: "INBOUND",
        callerName: contact ? contact.name : callerName,
        callerPhone,
        contactId: contact ? contact.id : null,
        propertyId,
        durationSeconds: duration,
        outcome: "INFO_PROVIDED",
        notes: `Twilio Call SID: ${callSid}. ${contact ? `Matched resident: ${contact.name}` : "Unrecognized caller"}`,
        recordingUrl: recordingUrl || "/mock-audio/call-recording-sample.mp3",
      },
    });

    // Output TwiML or JSON depending on Accept header
    if (req.headers.accept?.includes("application/json")) {
      return res.json({ success: true, callLog });
    }

    res.type("text/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling Property Operations. Your call reference is ${callRef}. An agent will assist you shortly.</Say>
</Response>`);
  } catch (e) {
    next(e);
  }
});

// 3. Inbound Email Webhook & Auto-Conversion Engine (SRS Section 8.3 & 9)
router.post("/email/inbound", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fromEmail = req.body.from || req.body.fromEmail || "resident@tenant.com";
    const toEmail = req.body.to || req.body.toEmail || "support@propertyops.com";
    const subject = req.body.subject || "Maintenance request";
    const body = req.body.text || req.body.body || "Please assist with an issue.";
    const threadId = req.body.threadId || `TH-${Date.now().toString(36).toUpperCase()}`;

    // Find contact by email
    const contact = await prisma.contact.findFirst({
      where: { email: fromEmail },
      include: { tenantedUnits: true },
    });

    let propertyId = null;
    let unitId = null;
    if (contact?.tenantedUnits?.length) {
      propertyId = contact.tenantedUnits[0].propertyId;
      unitId = contact.tenantedUnits[0].id;
    }

    // Create Email Record
    const emailMsg = await prisma.emailMessage.create({
      data: {
        direction: "INBOUND",
        fromEmail,
        toEmail,
        subject,
        body,
        threadId,
        contactId: contact?.id || null,
        propertyId,
        isRead: false,
      },
    });

    // Check Auto-Conversion Rules per SRS Section 9
    const triggerWords = ["leak", "repair", "urgent", "hvac", "broken", "emergency", "noise", "heat", "water"];
    const isIssue = triggerWords.some((w) => subject.toLowerCase().includes(w) || body.toLowerCase().includes(w));

    let createdRequest = null;
    if (isIssue) {
      // Pick property if not linked to tenant
      if (!propertyId) {
        const firstProp = await prisma.property.findFirst();
        propertyId = firstProp?.id || null;
      }

      if (propertyId) {
        const srCount = await prisma.serviceRequest.count();
        const reference = `SR-${new Date().getFullYear()}-${String(srCount + 1).padStart(3, "0")}`;

        const isEmergency = subject.toLowerCase().includes("emergency") || body.toLowerCase().includes("emergency");

        createdRequest = await prisma.serviceRequest.create({
          data: {
            reference,
            title: subject.replace(/^Re:\s*/i, ""),
            description: body,
            category: subject.toLowerCase().includes("leak") ? "PLUMBING" : subject.toLowerCase().includes("hvac") ? "HVAC" : "GENERAL",
            priority: isEmergency ? "EMERGENCY" : "NORMAL",
            source: "EMAIL",
            propertyId,
            unitId,
            requesterId: contact?.id || null,
          },
        });

        const adminUser = await prisma.user.findFirst();
        await prisma.activityLog.create({
          data: {
            userId: adminUser ? adminUser.id : createdRequest.id,
            action: "AUTO_CONVERT_EMAIL",
            module: "SERVICE_REQUESTS",
            recordId: createdRequest.id,
            detail: `Email from ${fromEmail} auto-converted to ${createdRequest.reference}`,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      email: emailMsg,
      autoConvertedToRequest: createdRequest ? createdRequest.reference : null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
