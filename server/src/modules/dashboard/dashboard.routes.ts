import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";
import { resources } from "../resources/registry";

const router = Router();
router.use(authenticate);

router.get("/", async (_req, res, next) => {
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
      recentActivities,
      urgentWorkOrders,
      upcomingMaintenance,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.unit.count({ where: { status: "OCCUPIED" } }),
      prisma.workOrder.count({ where: { status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] } } }),
      prisma.workOrder.count({ where: { priority: "EMERGENCY", status: { notIn: ["CLOSED", "CANCELLED"] } } }),
      prisma.vendor.count({ where: { status: "ACTIVE" } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.invoice.aggregate({ _sum: { balanceDue: true } }),
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, role: true } } },
      }),
      prisma.workOrder.findMany({
        where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: 5,
        include: {
          property: { select: { name: true } },
          unit: { select: { unitCode: true } },
          assignedUser: { select: { name: true } },
          assignedVendor: { select: { legalName: true } },
        },
      }),
      prisma.maintenancePlan.findMany({
        where: { active: true },
        orderBy: { nextDue: "asc" },
        take: 4,
        include: {
          property: { select: { name: true } },
          asset: { select: { name: true, assetCode: true } },
        },
      }),
    ]);

    const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(0) : "0";

    // Legacy module counts for backwards compatibility with starter widgets
    const counts = await Promise.all(
      resources.map(async (x) => ({
        key: x.key,
        label: x.label,
        count: await prisma.record.count({ where: { module: x.key, status: { not: "ARCHIVED" } } }),
      }))
    );

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
      counts,
      recent: recentActivities,
      urgentWorkOrders,
      upcomingMaintenance,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
