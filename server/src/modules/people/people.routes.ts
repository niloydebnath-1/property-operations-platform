import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List employees
router.get("/employees", async (req, res, next) => {
  try {
    const department = req.query.department ? String(req.query.department) : undefined;
    const where: any = {};
    if (department) where.department = department;

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    });

    res.json({ employees });
  } catch (e) {
    next(e);
  }
});

// Create employee
router.post("/employees", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      department: z.string().default("MAINTENANCE"),
      jobTitle: z.string().min(2),
      shiftHours: z.string().default("09:00 - 17:00"),
      userId: z.string().nullable().optional(),
    });

    const body = schema.parse(req.body);
    const count = await prisma.employee.count();
    const employeeCode = `EMP-${String(count + 1).padStart(3, "0")}`;

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        ...body,
      },
    });

    res.status(201).json({ employee });
  } catch (e) {
    next(e);
  }
});

export default router;
