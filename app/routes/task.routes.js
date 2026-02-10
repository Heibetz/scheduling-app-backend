import tasks from "../controllers/task.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new Task
router.post("/", [authenticate], tasks.create);

// Retrieve all Tasks
router.get("/", [authenticate], tasks.findAll);

// Retrieve a single Task with id
router.get("/:id", [authenticate], tasks.findOne);

// Update a Task with id
router.put("/:id", [authenticate], tasks.update);

// Delete a Task with id
router.delete("/:id", [authenticate], tasks.delete);

export default router;
