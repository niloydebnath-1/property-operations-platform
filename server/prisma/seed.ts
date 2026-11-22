import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding comprehensive Property Operations Platform database...");

  const passwordHash = await bcrypt.hash("Admin123!", 10);

  // 1. Users
  const usersData = [
    { name: "System Administrator", email: "admin@example.com", role: "SUPER_ADMIN", phone: "+1 (555) 000-0001", department: "EXECUTIVE" },
    { name: "Sarah Jenkins", email: "pm@example.com", role: "PROPERTY_MANAGER", phone: "+1 (555) 000-0002", department: "OPERATIONS" },
    { name: "Marcus Brody", email: "maint@example.com", role: "MAINTENANCE_MANAGER", phone: "+1 (555) 000-0003", department: "MAINTENANCE" },
    { name: "David Chen", email: "tech@example.com", role: "TECHNICIAN", phone: "+1 (555) 000-0004", department: "MAINTENANCE" },
    { name: "Robert Taylor", email: "agent@example.com", role: "CALL_AGENT", phone: "+1 (555) 000-0005", department: "CUSTOMER_SUPPORT" },
    { name: "Elena Rostova", email: "accountant@example.com", role: "ACCOUNTANT", phone: "+1 (555) 000-0006", department: "FINANCE" },
    { name: "Apex Contractor Portal", email: "vendor@example.com", role: "VENDOR", phone: "+1 (555) 000-0007", department: "EXTERNAL" },
    { name: "Alice Morgan (Tenant)", email: "tenant@example.com", role: "CLIENT", phone: "+1 (555) 000-0008", department: "RESIDENT" },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, phone: u.phone, department: u.department },
      create: { ...u, passwordHash },
    });
    createdUsers[u.email] = user;
  }

  // 2. Contacts (Clients, Tenants, Owners)
  const contactsData = [
    { name: "Alice Morgan", email: "alice.morgan@tenant.com", phone: "+1 (555) 123-4567", contactType: "TENANT", company: "Morgan Creative", address: "Apt 204, Grand View Heights" },
    { name: "Jonathan Sterling", email: "j.sterling@investments.com", phone: "+1 (555) 234-5678", contactType: "OWNER", company: "Sterling Assets LLC", address: "88 Wall St, Suite 500" },
    { name: "Global Logistics Inc", email: "operations@globallogistics.com", phone: "+1 (555) 345-6789", contactType: "CLIENT", company: "Global Logistics Inc", address: "Parkview Corporate Tower 3" },
    { name: "Michael Vance", email: "mvance@gmail.com", phone: "+1 (555) 456-7890", contactType: "TENANT", company: "Freelance", address: "Unit 102, Sunset Marina" },
    { name: "Apex Services Dispatch", email: "dispatch@apexhvac.com", phone: "+1 (555) 567-8901", contactType: "VENDOR_REP", company: "Apex HVAC Solutions", address: "Industrial Park Rd" },
  ];

  const createdContacts: Record<string, any> = {};
  for (const c of contactsData) {
    const contact = await prisma.contact.create({ data: c });
    createdContacts[c.email] = contact;
  }

  // 3. Properties
  const prop1 = await prisma.property.upsert({
    where: { propertyCode: "PROP-GVH-01" },
    update: {},
    create: {
      propertyCode: "PROP-GVH-01",
      name: "Grand View Heights",
      type: "RESIDENTIAL",
      address: "1420 Skyline Boulevard",
      city: "Metro City",
      state: "CA",
      zipCode: "90210",
      timezone: "America/Los_Angeles",
      status: "ACTIVE",
      managerId: createdUsers["pm@example.com"].id,
      ownerId: createdContacts["j.sterling@investments.com"].id,
      notes: "Luxury 8-floor residential condominium complex with swimming pool and gym.",
    },
  });

  const prop2 = await prisma.property.upsert({
    where: { propertyCode: "PROP-PCC-02" },
    update: {},
    create: {
      propertyCode: "PROP-PCC-02",
      name: "Parkview Corporate Center",
      type: "COMMERCIAL",
      address: "500 Enterprise Way",
      city: "Metro City",
      state: "CA",
      zipCode: "90215",
      timezone: "America/Los_Angeles",
      status: "ACTIVE",
      managerId: createdUsers["pm@example.com"].id,
      ownerId: createdContacts["j.sterling@investments.com"].id,
      notes: "Class A commercial office tower with multi-tenant commercial suites.",
    },
  });

  const prop3 = await prisma.property.upsert({
    where: { propertyCode: "PROP-SMV-03" },
    update: {},
    create: {
      propertyCode: "PROP-SMV-03",
      name: "Sunset Marina Villas",
      type: "MIXED",
      address: "880 Harbor Coast Road",
      city: "Bay City",
      state: "CA",
      zipCode: "94101",
      timezone: "America/Los_Angeles",
      status: "ACTIVE",
      managerId: createdUsers["pm@example.com"].id,
      ownerId: createdContacts["j.sterling@investments.com"].id,
      notes: "Mixed waterfront commercial retail and residential marina villas.",
    },
  });

  // 4. Units
  const unitsData = [
    { propertyId: prop1.id, unitCode: "Unit 101", floor: "1", type: "APARTMENT", areaSqFt: 850, rentAmount: 2200, status: "OCCUPIED", currentTenantId: createdContacts["mvance@gmail.com"].id },
    { propertyId: prop1.id, unitCode: "Unit 204", floor: "2", type: "APARTMENT", areaSqFt: 1100, rentAmount: 2850, status: "OCCUPIED", currentTenantId: createdContacts["alice.morgan@tenant.com"].id },
    { propertyId: prop1.id, unitCode: "Unit 305", floor: "3", type: "STUDIO", areaSqFt: 620, rentAmount: 1750, status: "VACANT" },
    { propertyId: prop1.id, unitCode: "Penthouse 801", floor: "8", type: "APARTMENT", areaSqFt: 2400, rentAmount: 5500, status: "RESERVED" },
    { propertyId: prop2.id, unitCode: "Suite 300", floor: "3", type: "OFFICE", areaSqFt: 3500, rentAmount: 8500, status: "OCCUPIED", currentTenantId: createdContacts["operations@globallogistics.com"].id },
    { propertyId: prop2.id, unitCode: "Suite 410", floor: "4", type: "OFFICE", areaSqFt: 2100, rentAmount: 5200, status: "VACANT" },
    { propertyId: prop3.id, unitCode: "Retail A-1", floor: "Ground", type: "RETAIL", areaSqFt: 1800, rentAmount: 4200, status: "VACANT" },
  ];

  const createdUnits: Record<string, any> = {};
  for (const u of unitsData) {
    const unit = await prisma.unit.upsert({
      where: { propertyId_unitCode: { propertyId: u.propertyId, unitCode: u.unitCode } },
      update: {},
      create: u,
    });
    createdUnits[`${u.propertyId}-${u.unitCode}`] = unit;
  }

  // 5. Leases
  await prisma.lease.upsert({
    where: { leaseNumber: "LSE-2026-001" },
    update: {},
    create: {
      leaseNumber: "LSE-2026-001",
      propertyId: prop1.id,
      unitId: createdUnits[`${prop1.id}-Unit 204`].id,
      contactId: createdContacts["alice.morgan@tenant.com"].id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      rentAmount: 2850,
      deposit: 2850,
      status: "ACTIVE",
      terms: "Standard 12-month residential lease. No pets without written deposit.",
    },
  });

  // 6. Vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { vendorCode: "VND-APEX-01" },
    update: {},
    create: {
      vendorCode: "VND-APEX-01",
      legalName: "Apex HVAC & Refrigeration Inc",
      tradeName: "Apex HVAC Solutions",
      email: "dispatch@apexhvac.com",
      phone: "+1 (555) 890-1234",
      serviceCategories: "HVAC, Ventilation, Chiller Systems, Thermostats",
      serviceArea: "Metro City, Bay City, Valley County",
      status: "ACTIVE",
      complianceStatus: "COMPLIANT",
      rating: 4.8,
      taxId: "XX-XXX4491",
      bankName: "First Commercial Bank",
      bankAccount: "********8941",
      notes: "Preferred contractor for commercial and residential AC & heating.",
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { vendorCode: "VND-PRO-02" },
    update: {},
    create: {
      vendorCode: "VND-PRO-02",
      legalName: "Reliable Pro Plumbing & Drains LLC",
      tradeName: "Pro Plumbing",
      email: "service@proplumbing.com",
      phone: "+1 (555) 789-0123",
      serviceCategories: "Plumbing, Sewer, Water Line, Boilers, Backflow Testing",
      serviceArea: "Metro City Metro Area",
      status: "ACTIVE",
      complianceStatus: "COMPLIANT",
      rating: 4.9,
      taxId: "XX-XXX8812",
      bankName: "City National Bank",
      bankAccount: "********1234",
    },
  });

  // Vendor Compliance Docs
  await prisma.vendorComplianceDoc.createMany({
    data: [
      { vendorId: vendor1.id, docType: "LICENSE", docNumber: "HVAC-C20-88192", expiryDate: new Date("2027-05-15"), verified: true, verifiedBy: "Sarah Jenkins" },
      { vendorId: vendor1.id, docType: "GENERAL_LIABILITY", docNumber: "POL-GL-992144", expiryDate: new Date("2027-01-30"), verified: true, verifiedBy: "Sarah Jenkins" },
      { vendorId: vendor2.id, docType: "LICENSE", docNumber: "PLUMB-C36-44012", expiryDate: new Date("2026-12-31"), verified: true, verifiedBy: "Sarah Jenkins" },
      { vendorId: vendor2.id, docType: "WORKERS_COMP", docNumber: "WC-55219-01", expiryDate: new Date("2026-11-28"), verified: true, status: "EXPIRING_SOON", verifiedBy: "Sarah Jenkins" },
    ],
    skipDuplicates: true,
  });

  // 7. Assets
  const asset1 = await prisma.asset.upsert({
    where: { assetCode: "AST-HVAC-001" },
    update: {},
    create: {
      assetCode: "AST-HVAC-001",
      name: "Carrier Rooftop Chiller Unit 1",
      category: "HVAC",
      propertyId: prop1.id,
      serialNo: "CAR-CH-8841-A",
      modelNo: "AquaSnap 30MP",
      manufacturer: "Carrier Global",
      installedAt: new Date("2023-04-10"),
      warrantyExpiry: new Date("2028-04-10"),
      condition: "GOOD",
      status: "OPERATIONAL",
    },
  });

  const asset2 = await prisma.asset.upsert({
    where: { assetCode: "AST-ELEV-002" },
    update: {},
    create: {
      assetCode: "AST-ELEV-002",
      name: "Otis Passenger Elevator Car 1",
      category: "ELEVATOR",
      propertyId: prop2.id,
      serialNo: "OTIS-GEN2-550",
      modelNo: "Gen2 Life",
      manufacturer: "Otis Elevator Company",
      installedAt: new Date("2022-09-15"),
      warrantyExpiry: new Date("2027-09-15"),
      condition: "EXCELLENT",
      status: "OPERATIONAL",
    },
  });

  // 8. Maintenance Plans
  await prisma.maintenancePlan.createMany({
    data: [
      {
        title: "Quarterly Commercial Chiller Preventive Servicing",
        propertyId: prop1.id,
        assetId: asset1.id,
        frequency: "QUARTERLY",
        recurrenceRule: "Every 90 days",
        nextDue: new Date(Date.now() + 15 * 86400000),
        active: true,
        assignedTeam: "Apex HVAC Solutions",
        estimatedCost: 750.0,
      },
      {
        title: "Monthly Passenger Elevator Safety Inspection & Lubrication",
        propertyId: prop2.id,
        assetId: asset2.id,
        frequency: "MONTHLY",
        recurrenceRule: "1st of every month",
        nextDue: new Date(Date.now() + 5 * 86400000),
        active: true,
        assignedTeam: "In-House Maintenance",
        estimatedCost: 350.0,
      },
      {
        title: "Annual Fire Alarm & Backflow Testing",
        propertyId: prop3.id,
        frequency: "ANNUAL",
        recurrenceRule: "Once per year",
        nextDue: new Date(Date.now() + 45 * 86400000),
        active: true,
        assignedTeam: "Reliable Pro Plumbing",
        estimatedCost: 1200.0,
      },
    ],
    skipDuplicates: true,
  });

  // 9. Service Requests
  const sr1 = await prisma.serviceRequest.upsert({
    where: { reference: "SR-2026-001" },
    update: {},
    create: {
      reference: "SR-2026-001",
      title: "Master bathroom shower head leak and low water pressure",
      description: "Water constantly drips from showerhead fitting, causing moisture buildup on tile grout.",
      category: "PLUMBING",
      priority: "NORMAL",
      status: "CONVERTED_TO_WO",
      source: "PORTAL",
      propertyId: prop1.id,
      unitId: createdUnits[`${prop1.id}-Unit 204`].id,
      requesterId: createdContacts["alice.morgan@tenant.com"].id,
      accessNotes: "Tenant works from home on Tuesdays and Thursdays.",
    },
  });

  const sr2 = await prisma.serviceRequest.upsert({
    where: { reference: "SR-2026-002" },
    update: {},
    create: {
      reference: "SR-2026-002",
      title: "Elevator Car 1 making grinding noise between floors 3 and 4",
      description: "Audible scraping sound observed during morning peak hours.",
      category: "ELECTRICAL",
      priority: "HIGH",
      status: "SUBMITTED",
      source: "CALL",
      propertyId: prop2.id,
      requesterId: createdContacts["operations@globallogistics.com"].id,
      accessNotes: "Freight entrance accessible via loading dock.",
    },
  });

  const sr3 = await prisma.serviceRequest.upsert({
    where: { reference: "SR-2026-003" },
    update: {},
    create: {
      reference: "SR-2026-003",
      title: "Air conditioning thermostat display blank, room temperature rising",
      description: "Main central thermostat in Suite 300 won't turn on. Server closet overheating risk.",
      category: "HVAC",
      priority: "EMERGENCY",
      status: "UNDER_REVIEW",
      source: "EMAIL",
      propertyId: prop2.id,
      unitId: createdUnits[`${prop2.id}-Suite 300`].id,
      requesterId: createdContacts["operations@globallogistics.com"].id,
      accessNotes: "Security badge required from 1st floor desk.",
    },
  });

  // 10. Work Orders with complete lifecycles
  const wo1 = await prisma.workOrder.upsert({
    where: { reference: "WO-2026-001" },
    update: {},
    create: {
      reference: "WO-2026-001",
      title: "Repair bathroom shower plumbing cartridge and valve",
      description: "Replace pressure balance cartridge and seal Teflon threads. Test hot/cold line pressure.",
      category: "PLUMBING",
      priority: "NORMAL",
      status: "IN_PROGRESS",
      propertyId: prop1.id,
      unitId: createdUnits[`${prop1.id}-Unit 204`].id,
      requestId: sr1.id,
      createdById: createdUsers["pm@example.com"].id,
      assigneeType: "TECHNICIAN",
      assignedUserId: createdUsers["tech@example.com"].id,
      estimatedCost: 180.0,
      scheduledStart: new Date(Date.now() - 3600000),
      scheduledEnd: new Date(Date.now() + 7200000),
    },
  });

  // Checklists for WO 1
  await prisma.workOrderChecklist.createMany({
    data: [
      { workOrderId: wo1.id, task: "Shut off unit main water valve", isCompleted: true, completedBy: "David Chen" },
      { workOrderId: wo1.id, task: "Disassemble shower trim kit and inspect cartridge", isCompleted: true, completedBy: "David Chen" },
      { workOrderId: wo1.id, task: "Install OEM Moen Positemp replacement cartridge", isCompleted: false },
      { workOrderId: wo1.id, task: "Restore water and conduct 10-minute leak check", isCompleted: false },
    ],
    skipDuplicates: true,
  });

  // WorkOrder Events
  await prisma.workOrderEvent.createMany({
    data: [
      { workOrderId: wo1.id, fromStatus: "DRAFT", toStatus: "SUBMITTED", actorName: "Sarah Jenkins", reason: "Service request converted" },
      { workOrderId: wo1.id, fromStatus: "SUBMITTED", toStatus: "APPROVED", actorName: "Sarah Jenkins", reason: "Standard repair within budget threshold" },
      { workOrderId: wo1.id, fromStatus: "APPROVED", toStatus: "ASSIGNED", actorName: "Marcus Brody", reason: "Assigned to in-house technician David Chen" },
      { workOrderId: wo1.id, fromStatus: "ASSIGNED", toStatus: "IN_PROGRESS", actorName: "David Chen", reason: "Technician arrived on site" },
    ],
    skipDuplicates: true,
  });

  const wo2 = await prisma.workOrder.upsert({
    where: { reference: "WO-2026-002" },
    update: {},
    create: {
      reference: "WO-2026-002",
      title: "Chiller compressor belt replacement & refrigerant recharge",
      description: "Replace worn compressor belts, clean condenser coils, and check R-410A refrigerant levels.",
      category: "HVAC",
      priority: "HIGH",
      status: "COMPLETED",
      propertyId: prop1.id,
      assetId: asset1.id,
      createdById: createdUsers["maint@example.com"].id,
      assigneeType: "VENDOR",
      assignedVendorId: vendor1.id,
      estimatedCost: 650.0,
      actualCost: 620.0,
      scheduledStart: new Date(Date.now() - 86400000),
      scheduledEnd: new Date(Date.now() - 72000000),
      completedAt: new Date(Date.now() - 72000000),
      closureSummary: "Belts replaced with Gates B56. Cleaned dual fan coils. System running at optimal 42 PSI suction.",
    },
  });

  const wo3 = await prisma.workOrder.upsert({
    where: { reference: "WO-2026-003" },
    update: {},
    create: {
      reference: "WO-2026-003",
      title: "Suite 300 emergency HVAC digital thermostat failure",
      description: "Emergency dispatch required for commercial server room temperature spike.",
      category: "HVAC",
      priority: "EMERGENCY",
      status: "APPROVED",
      propertyId: prop2.id,
      unitId: createdUnits[`${prop2.id}-Suite 300`].id,
      requestId: sr3.id,
      createdById: createdUsers["pm@example.com"].id,
      assigneeType: "VENDOR",
      assignedVendorId: vendor1.id,
      estimatedCost: 450.0,
      scheduledStart: new Date(Date.now() + 1800000),
    },
  });

  const wo4 = await prisma.workOrder.upsert({
    where: { reference: "WO-2026-004" },
    update: {},
    create: {
      reference: "WO-2026-004",
      title: "Annual fire alarm strobe and horn decibel testing",
      description: "Scheduled code compliance check across all common corridors.",
      category: "SECURITY",
      priority: "NORMAL",
      status: "CLOSED",
      propertyId: prop3.id,
      createdById: createdUsers["pm@example.com"].id,
      assigneeType: "TECHNICIAN",
      assignedUserId: createdUsers["tech@example.com"].id,
      estimatedCost: 300.0,
      actualCost: 295.0,
      completedAt: new Date(Date.now() - 5 * 86400000),
      verifiedAt: new Date(Date.now() - 4 * 86400000),
      closedAt: new Date(Date.now() - 4 * 86400000),
      closureSummary: "All alarms verified at 85+ dB. Inspection report submitted to City Fire Marshal.",
    },
  });

  // 11. Invoices & Payments
  const inv1 = await prisma.invoice.upsert({
    where: { invoiceNo: "INV-2026-001" },
    update: {},
    create: {
      invoiceNo: "INV-2026-001",
      partyType: "TENANT",
      contactId: createdContacts["alice.morgan@tenant.com"].id,
      propertyId: prop1.id,
      subtotal: 2850.0,
      tax: 0.0,
      total: 2850.0,
      balanceDue: 0.0,
      dueDate: new Date("2026-12-01"),
      status: "PAID",
      notes: "Monthly residential rent for December 2026.",
      lines: {
        create: [
          { description: "Monthly Rent - Unit 204 (Dec 2026)", quantity: 1, unitPrice: 2850.0, amount: 2850.0 }
        ]
      }
    },
  });

  await prisma.payment.upsert({
    where: { paymentRef: "PAY-2026-001" },
    update: {},
    create: {
      paymentRef: "PAY-2026-001",
      invoiceId: inv1.id,
      amount: 2850.0,
      paymentMethod: "BANK_TRANSFER",
      status: "SUCCESS",
      referenceNotes: "ACH auto-pay transaction #991428",
    },
  });

  const inv2 = await prisma.invoice.upsert({
    where: { invoiceNo: "INV-2026-002" },
    update: {},
    create: {
      invoiceNo: "INV-2026-002",
      partyType: "CLIENT",
      contactId: createdContacts["operations@globallogistics.com"].id,
      propertyId: prop2.id,
      subtotal: 8500.0,
      tax: 0.0,
      total: 8500.0,
      balanceDue: 8500.0,
      dueDate: new Date("2026-12-05"),
      status: "ISSUED",
      notes: "Suite 300 commercial lease monthly statement.",
      lines: {
        create: [
          { description: "Commercial Base Rent - Suite 300", quantity: 1, unitPrice: 8500.0, amount: 8500.0 }
        ]
      }
    },
  });

  // Vendor Bill
  const inv3 = await prisma.invoice.upsert({
    where: { invoiceNo: "BILL-APEX-1049" },
    update: {},
    create: {
      invoiceNo: "BILL-APEX-1049",
      partyType: "VENDOR",
      vendorId: vendor1.id,
      propertyId: prop1.id,
      workOrderId: wo2.id,
      subtotal: 620.0,
      tax: 0.0,
      total: 620.0,
      balanceDue: 620.0,
      dueDate: new Date(Date.now() + 20 * 86400000),
      status: "ISSUED",
      notes: "Contractor invoice for WO-2026-002 chiller belt servicing.",
      lines: {
        create: [
          { description: "Labor (4.0 hrs @ $110/hr)", quantity: 4, unitPrice: 110.0, amount: 440.0 },
          { description: "Parts: Gates B56 Heavy-Duty V-Belts (pair)", quantity: 1, unitPrice: 180.0, amount: 180.0 },
        ]
      }
    },
  });

  // 12. Expenses
  await prisma.expense.createMany({
    data: [
      {
        expenseRef: "EXP-2026-001",
        propertyId: prop1.id,
        workOrderId: wo1.id,
        category: "MATERIALS",
        amount: 45.0,
        description: "Moen 1222 Positemp single handle replacement cartridge",
        status: "APPROVED",
      },
      {
        expenseRef: "EXP-2026-002",
        propertyId: prop1.id,
        workOrderId: wo2.id,
        vendorId: vendor1.id,
        category: "LABOR",
        amount: 620.0,
        description: "HVAC vendor servicing invoice #BILL-APEX-1049",
        status: "APPROVED",
      },
    ],
    skipDuplicates: true,
  });

  // 13. Call Logs
  await prisma.callLog.createMany({
    data: [
      {
        callRef: "CALL-2026-101",
        direction: "INBOUND",
        callerName: "Marcus Vance",
        callerPhone: "+1 (555) 456-7890",
        agentId: createdUsers["agent@example.com"].id,
        contactId: createdContacts["mvance@gmail.com"].id,
        propertyId: prop1.id,
        durationSeconds: 142,
        outcome: "INFO_PROVIDED",
        notes: "Tenant inquired regarding recycling collection schedule and holiday package room hours.",
      },
      {
        callRef: "CALL-2026-102",
        direction: "INBOUND",
        callerName: "Global Logistics Facility Mgr",
        callerPhone: "+1 (555) 345-6789",
        agentId: createdUsers["agent@example.com"].id,
        contactId: createdContacts["operations@globallogistics.com"].id,
        propertyId: prop2.id,
        durationSeconds: 215,
        outcome: "REQUEST_CREATED",
        notes: "Reported blank HVAC thermostat in server room. Created urgent service request SR-2026-003.",
      },
    ],
    skipDuplicates: true,
  });

  // 14. Email Messages
  await prisma.emailMessage.createMany({
    data: [
      {
        direction: "INBOUND",
        fromEmail: "operations@globallogistics.com",
        toEmail: "support@propertyops.com",
        subject: "URGENT: Temperature alarm in Suite 300",
        body: "Hello Property Team,\n\nThe server room temperature reached 78°F this morning. The main wall thermostat appears unresponsive. Please dispatch a technician immediately.\n\nThank you,\nGlobal Logistics Operations",
        threadId: "TH-GL-881",
        isRead: true,
        contactId: createdContacts["operations@globallogistics.com"].id,
        propertyId: prop2.id,
      },
      {
        direction: "OUTBOUND",
        fromEmail: "support@propertyops.com",
        toEmail: "operations@globallogistics.com",
        subject: "Re: URGENT: Temperature alarm in Suite 300 [SR-2026-003]",
        body: "Hello,\n\nWe have received your emergency request (SR-2026-003). Apex HVAC Solutions has been dispatched and is estimated to arrive on site within 45 minutes.\n\nRegards,\nProperty Operations Support",
        threadId: "TH-GL-881",
        isRead: true,
        contactId: createdContacts["operations@globallogistics.com"].id,
        propertyId: prop2.id,
      },
    ],
    skipDuplicates: true,
  });

  // 15. Calendar Events
  await prisma.calendarEvent.createMany({
    data: [
      {
        title: "WO-2026-001: Shower Valve Repair",
        eventType: "WORK_ORDER",
        startAt: new Date(Date.now() - 3600000),
        endAt: new Date(Date.now() + 7200000),
        workOrderId: wo1.id,
        assignee: "David Chen",
        location: "Grand View Heights - Unit 204",
      },
      {
        title: "WO-2026-003: Emergency Server Room HVAC",
        eventType: "WORK_ORDER",
        startAt: new Date(Date.now() + 1800000),
        endAt: new Date(Date.now() + 9000000),
        workOrderId: wo3.id,
        assignee: "Apex HVAC Solutions",
        location: "Parkview Corporate - Suite 300",
      },
      {
        title: "Annual Property Roof Inspection",
        eventType: "INSPECTION",
        startAt: new Date(Date.now() + 86400000 * 2),
        endAt: new Date(Date.now() + 86400000 * 2 + 10800000),
        assignee: "Marcus Brody",
        location: "Sunset Marina Villas",
      },
    ],
    skipDuplicates: true,
  });

  // 16. Documents
  await prisma.document.createMany({
    data: [
      {
        fileName: "Residential_Lease_Unit204_Morgan.pdf",
        fileUrl: "/mock-docs/lease-unit204.pdf",
        fileCategory: "LEASE",
        entityType: "PROPERTY",
        entityId: prop1.id,
        propertyId: prop1.id,
        fileSizeKb: 450,
        uploadedBy: "Sarah Jenkins",
      },
      {
        fileName: "Carrier_Chiller_Maintenance_Manual.pdf",
        fileUrl: "/mock-docs/carrier-chiller-manual.pdf",
        fileCategory: "GENERAL",
        entityType: "PROPERTY",
        entityId: prop1.id,
        propertyId: prop1.id,
        fileSizeKb: 1820,
        uploadedBy: "Marcus Brody",
      },
      {
        fileName: "Apex_HVAC_Certificate_Of_Insurance_2026.pdf",
        fileUrl: "/mock-docs/coi-apex.pdf",
        fileCategory: "COMPLIANCE",
        entityType: "VENDOR",
        entityId: vendor1.id,
        fileSizeKb: 280,
        expiryDate: new Date("2027-01-30"),
        uploadedBy: "Sarah Jenkins",
      },
    ],
    skipDuplicates: true,
  });

  // 17. Employees & Staff
  await prisma.employee.createMany({
    data: [
      { employeeCode: "EMP-001", name: "Sarah Jenkins", email: "pm@example.com", department: "OPERATIONS", jobTitle: "Senior Property Manager", shiftHours: "08:30 - 17:30", userId: createdUsers["pm@example.com"].id },
      { employeeCode: "EMP-002", name: "Marcus Brody", email: "maint@example.com", department: "MAINTENANCE", jobTitle: "Maintenance Operations Lead", shiftHours: "07:00 - 16:00", userId: createdUsers["maint@example.com"].id },
      { employeeCode: "EMP-003", name: "David Chen", email: "tech@example.com", department: "MAINTENANCE", jobTitle: "Senior Field Maintenance Technician", shiftHours: "08:00 - 16:30", userId: createdUsers["tech@example.com"].id },
      { employeeCode: "EMP-004", name: "Robert Taylor", email: "agent@example.com", department: "CUSTOMER_SUPPORT", jobTitle: "Call Center Operations Agent", shiftHours: "09:00 - 18:00", userId: createdUsers["agent@example.com"].id },
      { employeeCode: "EMP-005", name: "Elena Rostova", email: "accountant@example.com", department: "FINANCE", jobTitle: "Property Operations Accountant", shiftHours: "09:00 - 17:00", userId: createdUsers["accountant@example.com"].id },
    ],
    skipDuplicates: true,
  });

  // 18. Notifications
  await prisma.notification.createMany({
    data: [
      { userId: createdUsers["admin@example.com"].id, title: "Emergency Work Order Dispatched", message: "WO-2026-003 was dispatched to Apex HVAC for Suite 300.", category: "WORK_ORDER", link: "/work-orders" },
      { userId: createdUsers["admin@example.com"].id, title: "Vendor Compliance Notice", message: "Pro Plumbing Workers Comp policy expires in 6 days.", category: "COMPLIANCE", link: "/vendors" },
      { userId: createdUsers["pm@example.com"].id, title: "New Service Request", message: "Tenant submitted SR-2026-001 for Unit 204.", category: "WORK_ORDER", link: "/service-requests" },
      { userId: createdUsers["tech@example.com"].id, title: "New Assignment", message: "You were assigned to WO-2026-001 at Grand View Heights.", category: "WORK_ORDER", link: "/work-orders" },
    ],
    skipDuplicates: true,
  });

  // 19. System Settings
  const settingsData = [
    { category: "COMPANY", key: "COMPANY_NAME", value: "Apex Property Management & Operations Ltd", description: "Operating legal entity name" },
    { category: "COMPANY", key: "OPERATING_TIMEZONE", value: "America/Los_Angeles", description: "Default company operational timezone" },
    { category: "COMPANY", key: "BASE_CURRENCY", value: "USD", description: "Default platform currency" },
    { category: "WORKFLOW", key: "APPROVAL_THRESHOLD_AMOUNT", value: "500", description: "Work order estimated cost threshold requiring manager approval" },
    { category: "WORKFLOW", key: "EMERGENCY_OVERRIDE_ENABLED", value: "true", description: "Allow emergency work orders to bypass initial approval" },
    { category: "NOTIFICATION", key: "DEFAULT_MAILBOX", value: "support@propertyops.com", description: "Outbound default notification sender address" },
  ];

  for (const s of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 20. Audit Logs
  await prisma.activityLog.createMany({
    data: [
      { userId: createdUsers["admin@example.com"].id, action: "INITIALIZE", module: "SYSTEM", detail: "Platform database initialized and baseline seeded." },
      { userId: createdUsers["pm@example.com"].id, action: "CREATE", module: "PROPERTIES", recordId: prop1.id, detail: "Grand View Heights (PROP-GVH-01) created." },
      { userId: createdUsers["pm@example.com"].id, action: "CREATE", module: "WORK_ORDERS", recordId: wo1.id, detail: "WO-2026-001 converted from SR-2026-001 and assigned." },
      { userId: createdUsers["tech@example.com"].id, action: "STATUS_CHANGE", module: "WORK_ORDERS", recordId: wo1.id, detail: "WO-2026-001 status changed to IN_PROGRESS." },
    ],
  });

  console.log("Seeding complete! Admin credentials: admin@example.com / Admin123!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
