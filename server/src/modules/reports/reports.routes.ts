import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// Reports summary (SRS Section 11 & 15)
router.get("/summary", async (_req, res, next) => {
  try {
    const [
      totalProperties,
      totalUnits,
      occupiedUnits,
      openWorkOrders,
      emergencyWorkOrders,
      activeVendors,
      totalRevenue,
      outstandingReceivables,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.unit.count({ where: { status: "OCCUPIED" } }),
      prisma.workOrder.count({ where: { status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] } } }),
      prisma.workOrder.count({ where: { priority: "EMERGENCY", status: { notIn: ["CLOSED", "CANCELLED"] } } }),
      prisma.vendor.count({ where: { status: "ACTIVE" } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.invoice.aggregate({ _sum: { balanceDue: true } }),
    ]);

    const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : "0";

    // Work orders breakdown by priority
    const woByPriority = await prisma.workOrder.groupBy({
      by: ["priority"],
      _count: { id: true },
    });

    // Work orders breakdown by status
    const woByStatus = await prisma.workOrder.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    res.json({
      metrics: {
        totalProperties,
        totalUnits,
        occupiedUnits,
        occupancyRate: `${occupancyRate}%`,
        openWorkOrders,
        emergencyWorkOrders,
        activeVendors,
        totalRevenue: totalRevenue._sum.amount || 0,
        outstandingReceivables: outstandingReceivables._sum.balanceDue || 0,
      },
      woByPriority,
      woByStatus,
    });
  } catch (e) {
    next(e);
  }
});

// Detailed multi-domain reports for all operational areas
router.get("/detailed", async (_req, res, next) => {
  try {
    const [workOrders, invoices, properties, vendors, serviceRequests] = await Promise.all([
      // 1. Work Orders & Maintenance Operations
      prisma.workOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          property: { select: { name: true, propertyCode: true } },
          unit: { select: { unitCode: true } },
          assignedUser: { select: { name: true, email: true } },
          assignedVendor: { select: { legalName: true } },
          checklists: true,
        },
      }),

      // 2. Financial Invoicing & Revenue Statements
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          contact: { select: { name: true, email: true, phone: true } },
          vendor: { select: { legalName: true, email: true } },
          property: { select: { name: true } },
          lines: true,
          payments: true,
        },
      }),

      // 3. Property Portfolio & Occupancy Yields
      prisma.property.findMany({
        orderBy: { name: "asc" },
        include: {
          units: true,
          _count: { select: { workOrders: true, assets: true } },
        },
      }),

      // 4. Vendors & Contractor Compliance
      prisma.vendor.findMany({
        orderBy: { legalName: "asc" },
        include: {
          complianceDocs: true,
          contracts: true,
          _count: { select: { workOrders: true, invoices: true } },
        },
      }),

      // 5. Service Requests Triage & Intake
      prisma.serviceRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          property: { select: { name: true } },
          unit: { select: { unitCode: true } },
          requester: { select: { name: true, phone: true, email: true } },
          workOrders: { select: { reference: true, status: true } },
        },
      }),
    ]);

    res.json({
      workOrders,
      invoices,
      properties,
      vendors,
      serviceRequests,
    });
  } catch (e) {
    next(e);
  }
});

// Single Printable / PDF Invoice Data with Full Details
router.get("/invoices/:id/printable", async (req, res, next) => {
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

    res.json({
      company: {
        name: "PropertyOps Enterprise Management LLC",
        taxId: "TAX-US-8829104",
        address: "742 Evergreen Terrace, Suite 500, New York, NY 10001",
        email: "billing@propertyops.com",
        phone: "+1 (800) 555-PROP",
        website: "www.propertyops.com",
      },
      invoice,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
