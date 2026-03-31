import notifications from "../controllers/notification.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new Notification
router.post("/", [authenticate], notifications.create);

// Get notifications for a user
router.get("/user/:userId", [authenticate], notifications.findByUser);

// Get a single notification
router.get("/:id", [authenticate], notifications.findOne);

// Mark notification as read
router.put("/:id/read", [authenticate], notifications.markAsRead);

// Delete all read notifications for a user
router.delete("/user/:userId/read", [authenticate], notifications.deleteRead);

export default router;
