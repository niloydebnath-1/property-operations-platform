import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const BASE = "http://localhost:4000/api";

async function runWorkingCycleQA() {
  console.log("======================================================================");
  console.log("       STARTING END-TO-END WORKING CYCLE COMPREHENSIVE QA");
  console.log("======================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName} ${detail ? `-> (${detail})` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `-> FAILED: (${detail})` : ""}`);
      failed++;
    }
  }

  // 0. Admin Login
  console.log(">>> [0] ADMIN AUTHENTICATION");
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "Admin123!" }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.ok && !!loginData.token, "Admin Login and JWT Issuance", `User: ${loginData.user?.name}`);
  const authHeaders = { Authorization: `Bearer ${loginData.token}`, "Content-Type": "application/json" };

  // STEP 1: Portfolio Setup & Onboarding
  console.log("\n>>> [STEP 1] PORTFOLIO SETUP & ONBOARDING");
  const randomSuffix = Math.floor(Math.random() * 900 + 100);

  // 1a. Create Property
  const propRes = await fetch(`${BASE}/properties`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: `Grandview Heights Tower C ${randomSuffix}`,
      propertyCode: `GV-C-${randomSuffix}`,
      type: "COMMERCIAL",
      address: "789 Enterprise Blvd",
      city: "Metropolis",
      state: "NY",
      zipCode: "10001",
    }),
  });
  const propData = await propRes.json();
  const propertyId = propData.property?.id;
  assert(propRes.ok && !!propertyId, "Create New Property", `ID: ${propertyId}, Code: ${propData.property?.propertyCode}`);

  // 1b. Create Unit
  const unitRes = await fetch(`${BASE}/units`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      propertyId,
      unitCode: `Penthouse-${randomSuffix}`,
      floor: "12",
      type: "COMMERCIAL",
      rentAmount: 4500,
      areaSqFt: 3200,
    }),
  });
  const unitData = await unitRes.json();
  const unitId = unitData.unit?.id;
  assert(unitRes.ok && !!unitId, "Create Unit Under Property", `Unit: ${unitData.unit?.unitCode}`);

  // 1c. Create Contact / Tenant
  const contactRes = await fetch(`${BASE}/contacts`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: `Rahim Chowdhury ${randomSuffix}`,
      contactType: "CLIENT",
      email: `rahim.${randomSuffix}@example.com`,
      phone: `+1555${randomSuffix}99`,
      company: "Chowdhury Global Logistics",
    }),
  });
  const contactData = await contactRes.json();
  const contactId = contactData.contact?.id;
  const contactPhone = contactData.contact?.phone;
  assert(contactRes.ok && !!contactId, "Onboard New Tenant Contact", `Contact: ${contactData.contact?.name}`);

  // 1d. Create Asset
  const assetRes = await fetch(`${BASE}/maintenance/assets`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      propertyId,
      name: "Trane High-Capacity HVAC Chiller",
      category: "HVAC",
      serialNo: `TRANE-HVAC-${randomSuffix}`,
      modelNo: "TRANE-X400",
      manufacturer: "Trane Corp",
      status: "OPERATIONAL",
      condition: "GOOD",
    }),
  });
  const assetData = await assetRes.json();
  const assetId = assetData.asset?.id;
  assert(assetRes.ok && !!assetId, "Register High-Value Asset", `Asset: ${assetData.asset?.name} (${assetData.asset?.assetCode})`);

  // STEP 2: Incident Intake via 3 Channels
  console.log("\n>>> [STEP 2] MULTI-CHANNEL INCIDENT INTAKE");
  
  // 2a. Tenant Self-Service Portal Request
  const portalReqRes = await fetch(`${BASE}/service-requests`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Penthouse HVAC blowing warm air during heatwave",
      description: "Temperature inside penthouse reached 82F, compressor seems seized.",
      category: "HVAC",
      priority: "EMERGENCY",
      source: "PORTAL",
      propertyId,
      unitId,
      requesterId: contactId,
    }),
  });
  const portalReqData = await portalReqRes.json();
  const serviceRequestId = portalReqData.request?.id;
  assert(portalReqRes.ok && !!serviceRequestId, "Channel A: Portal Service Request Ingestion", `Ref: ${portalReqData.request?.reference}`);

  // 2b. Twilio Telephony Inbound Call with Automatic Contact Identification
  const twilioCallRes = await fetch(`${BASE}/webhooks/twilio/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      From: contactPhone,
      CallerName: contactData.contact?.name,
      CallDuration: 125,
    }),
  });
  const twilioCallData = await twilioCallRes.json();
  assert(
    twilioCallRes.ok && twilioCallData.callLog?.contactId === contactId,
    "Channel B: Twilio Call Webhook & Automatic Tenant Caller Lookup",
    `Resolved Contact ID: ${twilioCallData.callLog?.contactId}`
  );

  // 2c. Inbound Email Webhook Auto-Conversion
  const emailRes = await fetch(`${BASE}/webhooks/email/inbound`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromEmail: contactData.contact?.email,
      toEmail: "support@propertyops.com",
      subject: `Urgent: Water pipe leaking under sink in Unit ${unitData.unit?.unitCode}`,
      body: "Small drip has turned into steady puddle under kitchen sink.",
    }),
  });
  const emailData = await emailRes.json();
  assert(
    emailRes.ok && !!emailData.autoConvertedToRequest,
    "Channel C: Inbound Email Parsing & Auto-Creation of Service Request",
    `Created Ticket: ${emailData.autoConvertedToRequest}`
  );

  // STEP 3: Triage & Work Order Conversion
  console.log("\n>>> [STEP 3] TRIAGE & WORK ORDER CONVERSION");
  const convertRes = await fetch(`${BASE}/service-requests/${serviceRequestId}/convert-to-work-order`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Emergency Repair: Trane Rooftop Chiller Unit",
      description: "Perform diagnostic, recharge R410A refrigerant and replace starter capacitor.",
      estimatedCost: 350.00,
      priority: "EMERGENCY",
      assigneeType: "TECHNICIAN",
      scheduledStart: new Date().toISOString(),
    }),
  });
  const convertData = await convertRes.json();
  const workOrderId = convertData.workOrder?.id;
  assert(
    convertRes.ok && convertData.workOrder?.status === "ASSIGNED",
    "Manager Triage -> Conversion to Work Order",
    `WO Ref: ${convertData.workOrder?.reference}, Status: ${convertData.workOrder?.status}`
  );

  // Add Checklist items to the Work Order via endpoint
  const check1Res = await fetch(`${BASE}/work-orders/${workOrderId}/checklist`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ task: "Turn off 3-phase power disconnect switch" }),
  });
  const check1Data = await check1Res.json();

  const check2Res = await fetch(`${BASE}/work-orders/${workOrderId}/checklist`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ task: "Connect digital manifold gauge and check PSI" }),
  });
  const check2Data = await check2Res.json();

  const check3Res = await fetch(`${BASE}/work-orders/${workOrderId}/checklist`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ task: "Verify blower airflow and thermostat reading at 68F" }),
  });
  const check3Data = await check3Res.json();

  assert(check1Res.ok && check2Res.ok && check3Res.ok, "Attach Safety Checklists to Work Order", "3 Items Added");

  // STEP 4: Strict State Machine Workflow (ASSIGNED -> IN_PROGRESS -> COMPLETED -> VERIFIED -> CLOSED)
  console.log("\n>>> [STEP 4] WORK ORDER STRICT STATE MACHINE TRANSITIONS");

  // 4a. Transition to IN_PROGRESS
  const trans1Res = await fetch(`${BASE}/work-orders/${workOrderId}/transitions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      toStatus: "IN_PROGRESS",
      reason: "Technician arrived on site with multimeter and HVAC repair kit",
    }),
  });
  const trans1Data = await trans1Res.json();
  assert(trans1Res.ok && trans1Data.workOrder?.status === "IN_PROGRESS", "State Machine: ASSIGNED -> IN_PROGRESS");

  // 4b. Toggle checklist items in field
  const toggleRes = await fetch(`${BASE}/work-orders/checklist/${check1Data.item.id}/toggle`, {
    method: "PATCH",
    headers: authHeaders,
  });
  const toggleData = await toggleRes.json();
  assert(toggleRes.ok && toggleData.item?.isCompleted === true, "Technician Checks Off Safety Checklist in Field");

  // 4c. Transition to COMPLETED
  const trans2Res = await fetch(`${BASE}/work-orders/${workOrderId}/transitions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      toStatus: "COMPLETED",
      reason: "Refrigerant recharged, starter capacitor replaced, temperature stable at 68F",
      actualCost: 320.00,
    }),
  });
  const trans2Data = await trans2Res.json();
  assert(trans2Res.ok && trans2Data.workOrder?.status === "COMPLETED", "State Machine: IN_PROGRESS -> COMPLETED");

  // 4d. Quality Verification by Operations Manager
  const trans3Res = await fetch(`${BASE}/work-orders/${workOrderId}/transitions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      toStatus: "VERIFIED",
      reason: "Operations Lead verified chiller discharge air at 54F and tenant confirmed comfort",
    }),
  });
  const trans3Data = await trans3Res.json();
  assert(trans3Res.ok && trans3Data.workOrder?.status === "VERIFIED", "State Machine: COMPLETED -> VERIFIED");

  // 4e. Final Closure & Sign-off
  const trans4Res = await fetch(`${BASE}/work-orders/${workOrderId}/transitions`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      toStatus: "CLOSED",
      reason: "Tenant Rahim signed work order sign-off slip. Job officially archived.",
    }),
  });
  const trans4Data = await trans4Res.json();
  assert(trans4Res.ok && trans4Data.workOrder?.status === "CLOSED", "State Machine: VERIFIED -> CLOSED");

  // Verify WorkOrderEvent Audit Trail
  const events = await prisma.workOrderEvent.findMany({
    where: { workOrderId },
    orderBy: { createdAt: "asc" },
  });
  assert(events.length >= 4, "Immutable WorkOrderEvent History Logged", `Events Count: ${events.length}`);

  // STEP 5: Billing, Invoicing & Stripe Webhook Payment
  console.log("\n>>> [STEP 5] FINANCE, SEQUENTIAL INVOICE & STRIPE SETTLEMENT");

  // 5a. Create Sequential Invoice (INV-YYYY-XXXX)
  const invoiceRes = await fetch(`${BASE}/finance/invoices`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      partyType: "CLIENT",
      contactId,
      propertyId,
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      notes: "Emergency HVAC repair labor and refrigerant charge for Penthouse",
      lines: [
        { description: "HVAC Emergency Diagnostic & Labor", quantity: 2, unitPrice: 110.00 },
        { description: "R410A Refrigerant 2 lbs", quantity: 2, unitPrice: 50.00 },
      ],
    }),
  });
  const invoiceData = await invoiceRes.json();
  const invoiceId = invoiceData.invoice?.id;
  const invoiceNo = invoiceData.invoice?.invoiceNo;
  const totalAmount = Number(invoiceData.invoice?.total);
  assert(
    invoiceRes.ok && !!invoiceId && totalAmount === 320.00,
    "Sequential Invoice Generation",
    `No: ${invoiceNo}, Total: $${totalAmount}`
  );

  // 5b. Generate Stripe Checkout Session
  const stripeSessionRes = await fetch(`${BASE}/integrations/payment/checkout-session`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      invoiceId,
    }),
  });
  const stripeSessionData = await stripeSessionRes.json();
  assert(stripeSessionRes.ok && !!stripeSessionData.sessionId, "Generate Stripe Checkout Session", `Session: ${stripeSessionData.sessionId}`);

  // 5c. Trigger Stripe Webhook (checkout.session.completed)
  const stripeWebhookRes = await fetch(`${BASE}/webhooks/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "checkout.session.completed",
      data: {
        object: {
          id: stripeSessionData.sessionId,
          client_reference_id: invoiceNo,
          amount_total: Math.round(totalAmount * 100),
          customer_details: { email: `rahim.${randomSuffix}@example.com` },
        },
      },
    }),
  });
  const stripeWebhookData = await stripeWebhookRes.json();
  assert(
    stripeWebhookRes.ok && stripeWebhookData.status === "PAID",
    "Stripe Webhook Payment Settlement",
    `Status: ${stripeWebhookData.status}`
  );

  // 5d. Verify Invoice Status and Balance in Database
  const verifiedInvoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  assert(
    verifiedInvoice?.status === "PAID" && Number(verifiedInvoice.balanceDue) === 0 && verifiedInvoice.payments.length > 0,
    "Database Balance Due Reconciled to $0.00 and Payment Recorded",
    `Balance Due: $${verifiedInvoice?.balanceDue}`
  );

  // STEP 6: Preventive Maintenance Recurrence Engine
  console.log("\n>>> [STEP 6] PREVENTIVE MAINTENANCE RECURRENCE ENGINE");
  // 6a. Create PM Plan for HVAC Asset
  const pmPlanRes = await fetch(`${BASE}/maintenance/plans`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      title: "Quarterly Comprehensive Chiller Servicing",
      propertyId,
      assetId,
      frequency: "QUARTERLY",
      nextDue: new Date(Date.now() + 3 * 86400000).toISOString(), // Due in 3 days
      estimatedCost: 280.00,
      description: "Inspect refrigerant levels, lubricate bearings and test airflow.",
    }),
  });
  const pmPlanData = await pmPlanRes.json();
  assert(pmPlanRes.ok && !!pmPlanData.plan?.id, "Create PM Plan for Asset", `Plan: ${pmPlanData.plan?.title}`);

  // 6b. Run PM Auto-Scheduler Engine
  const pmGenRes = await fetch(`${BASE}/maintenance/plans/generate`, {
    method: "POST",
    headers: authHeaders,
  });
  const pmGenData = await pmGenRes.json();
  assert(pmGenRes.ok, "PM Recurrence Engine Execution", `Result: ${pmGenData.message}`);

  // STEP 7: Real Document Upload, Expiry Tracking & Analytics
  console.log("\n>>> [STEP 7] DOCUMENT COMPLIANCE, KPI ANALYTICS & AUDIT LOGS");

  // 7a. Real File Upload with Multer
  const tempDocPath = path.join(process.cwd(), "EPA_HVAC_Certification.txt");
  fs.writeFileSync(tempDocPath, "EPA Section 608 Universal Technician Certification for Grandview Chiller C.");

  const formData = new FormData();
  formData.append("file", new Blob([fs.readFileSync(tempDocPath)]), "EPA_HVAC_Certification.txt");
  formData.append("fileCategory", "COMPLIANCE");
  formData.append("entityType", "ASSET");
  formData.append("entityId", assetId);
  formData.append("expiryDate", new Date(Date.now() + 15 * 86400000).toISOString()); // Expiring in 15 days

  const docUploadRes = await fetch(`${BASE}/documents/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${loginData.token}` },
    body: formData,
  });
  const docUploadData = await docUploadRes.json();
  assert(docUploadRes.ok && !!docUploadData.document?.id, "Multipart Document Upload with Expiry Date", docUploadData.document?.fileName);

  if (fs.existsSync(tempDocPath)) fs.unlinkSync(tempDocPath);

  // 7b. Check Expiring Documents Queue
  const expiringRes = await fetch(`${BASE}/documents/expiring?days=30`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const expiringData = await expiringRes.json();
  assert(
    expiringRes.ok && expiringData.generalDocs?.some((d: any) => d.id === docUploadData.document?.id),
    "30-Day Document Expiry Monitoring Alert Queue"
  );

  // 7c. Check Dashboard Metrics & Activity Log
  const dashRes = await fetch(`${BASE}/dashboard`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const dashData = await dashRes.json();
  assert(
    dashRes.ok && dashData.metrics?.totalProperties >= 4 && dashData.metrics?.totalRevenue > 0,
    "Live Dashboard Real-time KPI Calculation",
    `Total Revenue: $${dashData.metrics?.totalRevenue}`
  );

  // 7d. Check Portal Frontend Responses
  const portalReqPage = await fetch("http://localhost:3000/portal/requests");
  const portalInvPage = await fetch("http://localhost:3000/portal/invoices");
  assert(portalReqPage.status === 200, "Client Portal Requests Page (HTTP 200)");
  assert(portalInvPage.status === 200, "Client Portal Invoices Page (HTTP 200)");

  console.log("\n======================================================================");
  console.log(`WORKING CYCLE QA COMPLETE: ${passed} PASSED, ${failed} FAILED (SUCCESS: ${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log("======================================================================\n");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runWorkingCycleQA().catch((err) => {
  console.error("FATAL ERROR IN WORKING CYCLE QA:", err);
  process.exit(1);
});
