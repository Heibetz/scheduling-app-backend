import shiftTaskController from "../controllers/shifttask.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
const router = Router();


// Create a new ShiftTask
router.post("/", [authenticate], shiftTaskController.create);

// Retrieve all ShiftTasks
router.get("/", [authenticate], shiftTaskController.findAll);

// Retrieve a single ShiftTask by id
router.get("/:id", [authenticate], shiftTaskController.findOne);

// Update a ShiftTask by id
router.put("/:id", [authenticate], shiftTaskController.update);

// Delete a ShiftTask by id
router.delete("/:id", [authenticate], shiftTaskController.delete);

export default router;