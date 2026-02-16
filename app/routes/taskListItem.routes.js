import taskListItemController from "../controllers/taskListItem.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
const router = Router();

// Create a new TaskListItem
router.post("/", [authenticate], taskListItemController.create);

// Retrieve all TaskListItems (optional ?task_id= for filter by task)
router.get("/", [authenticate], taskListItemController.findAll);

// Retrieve a single TaskListItem by id
router.get("/:id", [authenticate], taskListItemController.findOne);

// Update a TaskListItem by id
router.put("/:id", [authenticate], taskListItemController.update);

// Delete a TaskListItem by id
router.delete("/:id", [authenticate], taskListItemController.delete);

export default router;
