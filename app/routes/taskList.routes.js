import taskListController from "../controllers/taskList.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new TaskList
router.post("/", [authenticate], taskListController.create);

// Retrieve all TaskLists (optional ?area_id= for getByArea)
router.get("/", [authenticate], taskListController.findAll);

// Retrieve a single TaskList with id (getById)
router.get("/:id", [authenticate], taskListController.findOne);

// Update a TaskList with id
router.put("/:id", [authenticate], taskListController.update);

// Delete a TaskList with id
router.delete("/:id", [authenticate], taskListController.delete);

export default router;
