import taskListItemStatusController from "../controllers/taskListItemStatus.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
const router = Router();

// Create a new TaskListItemStatus
router.post("/", [authenticate], taskListItemStatusController.create);

// Retrieve all TaskListItemStatuses (optional ?shift_id= & ?task_list_item_id=)
router.get("/", [authenticate], taskListItemStatusController.findAll);

// Retrieve a single TaskListItemStatus by id
router.get("/:id", [authenticate], taskListItemStatusController.findOne);

// Update a TaskListItemStatus by id
router.put("/:id", [authenticate], taskListItemStatusController.update);

// Delete a TaskListItemStatus by id
router.delete("/:id", [authenticate], taskListItemStatusController.delete);

export default router;
