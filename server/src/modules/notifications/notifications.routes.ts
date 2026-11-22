import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authenticate } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

// List notifications
router.get("/", async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (e) {
    next(e);
  }
});

// Mark single notification read
router.patch("/:id/read", async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: String(req.params.id) },
      data: { isRead: true },
    });

    res.json({ notification });
  } catch (e) {
    next(e);
  }
});

// Mark all read
router.post("/read-all", async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (e) {
    next(e);
  }
});

export default router;
