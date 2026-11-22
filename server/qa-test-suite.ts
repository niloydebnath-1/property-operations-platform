import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const BASE = "http://localhost:4000/api";

async function runQA() {
  console.log("=================================================");
  console.log("STARTING FULL END-TO-END QA TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // 1. Authentication Test
  console.log("--- 1. AUTHENTICATION & SECURITY ---");
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "Admin123!" }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.ok && !!loginData.token, "Admin Authentication with JWT", loginData.message);
  const token = loginData.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Health & Metrics
  console.log("\n--- 2. API HEALTH & DASHBOARD ---");
  const healthRes = await fetch(`${BASE}/health`);
  const healthData = await healthRes.json();
  assert(healthRes.ok && healthData.status === "ok", "API Health Check");

  const dashRes = await fetch(`${BASE}/dashboard`, { headers: authHeaders });
  const dashData = await dashRes.json();
  assert(dashRes.ok && dashData.metrics.totalProperties > 0, "Dashboard KPI Aggregation", `Properties: ${dashData.metrics?.totalProperties}`);

  // 3. Properties & Units
  console.log("\n--- 3. PORTFOLIO & INVENTORY ---");
  const propRes = await fetch(`${BASE}/properties`, { headers: authHeaders });
  const propData = await propRes.json();
  assert(propRes.ok && propData.properties?.length >= 3, "Properties Directory Listing", `Count: ${propData.properties?.length}`);

  const unitRes = await fetch(`${BASE}/units`, { headers: authHeaders });
  const unitData = await unitRes.json();
  assert(unitRes.ok && unitData.units?.length >= 5, "Units Inventory Listing", `Count: ${unitData.units?.length}`);

  // 4. Service Request to Work Order Lifecycle
  console.log("\n--- 4. SERVICE OPERATIONS LIFECYCLE & WORK ORDERS ---");
  const testPropertyId = propData.properties[0].id;
  const createSrRes = await fetch(`${BASE}/service-requests`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "QA Test: Hallway smoke detector battery replacement",
      description: "Intermittent low-battery chirp every 45 seconds.",
      category: "ELECTRICAL",
      priority: "NORMAL",
      propertyId: testPropertyId,
    }),
  });
  const createSrData = await createSrRes.json();
  assert(createSrRes.ok && !!createSrData.request?.id, "Service Request Intake Creation", createSrData.request?.reference);

  // Convert to Work Order
  const convertRes = await fetch(`${BASE}/service-requests/${createSrData.request.id}/convert-to-work-order`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Work Order: Replace 9V Smoke Detector Batteries",
      description: "Replace with standard Duracell 9V battery and perform test beep.",
      estimatedCost: 25,
      assigneeType: "TECHNICIAN",
    }),
  });
  const convertData = await convertRes.json();
  assert(convertRes.ok && convertData.workOrder?.status === "ASSIGNED", "Service Request to Work Order Conversion", convertData.workOrder?.reference);
  const testWoId = convertData.workOrder.id;

  // State Machine Transition: ASSIGNED -> IN_PROGRESS
  const startWoRes = await fetch(`${BASE}/work-orders/${testWoId}/transitions`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ toStatus: "IN_PROGRESS", reason: "Technician on site" }),
  });
  const startWoData = await startWoRes.json();
  assert(startWoRes.ok && startWoData.workOrder?.status === "IN_PROGRESS", "State Machine Transition: ASSIGNED -> IN_PROGRESS");

  // State Machine Transition: IN_PROGRESS -> COMPLETED
  const compWoRes = await fetch(`${BASE}/work-orders/${testWoId}/transitions`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ toStatus: "COMPLETED", reason: "Batteries replaced and tested", actualCost: 22 }),
  });
  const compWoData = await compWoRes.json();
  assert(compWoRes.ok && compWoData.workOrder?.status === "COMPLETED", "State Machine Transition: IN_PROGRESS -> COMPLETED");

  // State Machine Transition: COMPLETED -> VERIFIED
  const verifyWoRes = await fetch(`${BASE}/work-orders/${testWoId}/transitions`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ toStatus: "VERIFIED", reason: "Verified by operations lead" }),
  });
  const verifyWoData = await verifyWoRes.json();
  assert(verifyWoRes.ok && verifyWoData.workOrder?.status === "VERIFIED", "State Machine Transition: COMPLETED -> VERIFIED");

  // State Machine Transition: VERIFIED -> CLOSED
  const closeWoRes = await fetch(`${BASE}/work-orders/${testWoId}/transitions`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ toStatus: "CLOSED", reason: "Ticket closed with full sign-off" }),
  });
  const closeWoData = await closeWoRes.json();
  assert(closeWoRes.ok && closeWoData.workOrder?.status === "CLOSED", "State Machine Transition: VERIFIED -> CLOSED");

  // 5. Preventive Maintenance Recurrence Engine
  console.log("\n--- 5. MAINTENANCE SCHEDULER ENGINE ---");
  const pmGenRes = await fetch(`${BASE}/maintenance/plans/generate`, {
    method: "POST",
    headers: authHeaders,
  });
  const pmGenData = await pmGenRes.json();
  assert(pmGenRes.ok, "Preventive Maintenance Recurrence Scheduler", pmGenData.message);

  // 6. Invoicing & Payment Reconciliation
  console.log("\n--- 6. FINANCE & PAYMENT RECONCILIATION ---");
  const createInvRes = await fetch(`${BASE}/finance/invoices`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      partyType: "CLIENT",
      propertyId: testPropertyId,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      notes: "QA Invoice for quarterly common area cleaning",
      lines: [{ description: "Common corridor deep cleaning", quantity: 1, unitPrice: 350 }],
    }),
  });
  const createInvData = await createInvRes.json();
  assert(createInvRes.ok && !!createInvData.invoice?.id, "Sequential Invoice Generation", createInvData.invoice?.invoiceNo);
  const testInvId = createInvData.invoice.id;

  // Record Partial Payment
  const payRes = await fetch(`${BASE}/finance/payments`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      invoiceId: testInvId,
      amount: 200,
      paymentMethod: "BANK_TRANSFER",
      referenceNotes: "Wire transfer #QA-001",
    }),
  });
  const payData = await payRes.json();
  assert(payRes.ok && Number(payData.invoice?.balanceDue) === 150 && payData.invoice?.status === "PARTIALLY_PAID", "Partial Payment Allocation & Balance Update", `Balance: ${payData.invoice?.balanceDue}`);

  // 7. Integrations & Webhooks
  console.log("\n--- 7. THIRD-PARTY INTEGRATIONS & WEBHOOKS ---");
  // Stripe Webhook Test
  const stripeWebhookRes = await fetch(`${BASE}/webhooks/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_qa_test_session",
          client_reference_id: createInvData.invoice.invoiceNo,
          amount_total: 15000, // Remaining $150
        },
      },
    }),
  });
  const stripeWebhookData = await stripeWebhookRes.json();
  assert(stripeWebhookRes.ok && stripeWebhookData.status === "PAID", "Stripe Checkout Webhook Automated Settlement", stripeWebhookData.invoiceNo);

  // Twilio Voice Inbound Call Webhook
  const twilioRes = await fetch(`${BASE}/webhooks/twilio/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      From: "+1 (555) 123-4567",
      CallerName: "Alice Morgan",
      CallDuration: 90,
    }),
  });
  const twilioData = await twilioRes.json();
  assert(twilioRes.ok && twilioData.callLog?.callRef?.startsWith("CALL-TWILIO"), "Twilio Voice Webhook Caller Mapping", twilioData.callLog?.callRef);

  // Inbound Email Webhook & Auto-Conversion
  const emailWebhookRes = await fetch(`${BASE}/webhooks/email/inbound`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromEmail: "alice.morgan@tenant.com",
      toEmail: "support@propertyops.com",
      subject: "Urgent: Water pipe leaking under sink",
      body: "There is water pooling under my kitchen sink. Please fix soon.",
    }),
  });
  const emailWebhookData = await emailWebhookRes.json();
  assert(emailWebhookRes.ok && !!emailWebhookData.autoConvertedToRequest, "Inbound Email Webhook Auto-Conversion to Service Request", emailWebhookData.autoConvertedToRequest);

  // 8. Real File Upload & Download
  console.log("\n--- 8. DOCUMENT STORAGE & UPLOAD ---");
  const testFilePath = path.join(process.cwd(), "test-qa-doc.txt");
  fs.writeFileSync(testFilePath, "Sample Property Operations compliance document test contents.");

  const formData = new FormData();
  formData.append("file", new Blob([fs.readFileSync(testFilePath)]), "qa-test-doc.txt");
  formData.append("fileCategory", "COMPLIANCE");
  formData.append("entityType", "PROPERTY");
  formData.append("entityId", testPropertyId);

  const uploadRes = await fetch(`${BASE}/documents/upload`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  });
  const uploadData = await uploadRes.json();
  assert(uploadRes.ok && !!uploadData.document?.id, "Real Multipart File Upload to Storage", uploadData.document?.fileName);

  // Download uploaded file
  if (uploadData.document?.id) {
    const downloadRes = await fetch(`${BASE}/documents/${uploadData.document.id}/download`, { headers: authHeaders });
    assert(downloadRes.ok, "Physical Document Download Stream");
  }

  // Cleanup test file
  if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);

  // 9. Frontend Route Health QA
  console.log("\n--- 9. FRONTEND ROUTE HEALTH PASS (HTTP 200) ---");
  const routes = [
    "/dashboard",
    "/properties",
    "/units",
    "/contacts",
    "/service-requests",
    "/work-orders",
    "/maintenance",
    "/vendors",
    "/communications",
    "/calendar",
    "/finance",
    "/documents",
    "/reports",
    "/people",
    "/settings",
    "/portal/requests",
    "/portal/invoices",
  ];

  for (const r of routes) {
    const res = await fetch(`http://localhost:3000${r}`);
    assert(res.status === 200, `Frontend Route [${r}]`);
  }

  console.log("\n=================================================");
  console.log(`QA TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runQA().catch((e) => {
  console.error("FATAL QA FAILURE:", e);
  process.exit(1);
});
