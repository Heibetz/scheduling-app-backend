import shifts from "../controllers/shift.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new Shift
router.post("/", [authenticate], shifts.create);

// Retrieve all Shifts
router.get("/", [authenticate], shifts.findAll);

// Retrieve a single Shift with id
router.get("/:id", [authenticate], shifts.findOne);

// Retrieve all Shifts for a specific schedule
router.get("/schedule/:schedule_id", [authenticate], shifts.findByScheduleId);

// Retrieve all Shifts for a specific user
router.get("/user/:user_id", [authenticate], shifts.findByUserId);

// Update a Shift with id
router.put("/:id", [authenticate], shifts.update);

// Delete a Shift with id
router.delete("/:id", [authenticate], shifts.delete);

export default router;
