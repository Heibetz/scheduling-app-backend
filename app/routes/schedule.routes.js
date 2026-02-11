import schedules from "../controllers/schedule.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new Schedule
router.post("/", [authenticate], schedules.create);

// Retrieve all Schedules
router.get("/", [authenticate], schedules.findAll);

// Retrieve a single Schedule with id
router.get("/:id", [authenticate], schedules.findOne);

// Retrieve all Schedules for a specific area
router.get("/area/:area_id", [authenticate], schedules.findByArea);

// Update a Schedule with id
router.put("/:id", [authenticate], schedules.update);

// Delete a Schedule with id
router.delete("/:id", [authenticate], schedules.delete);

// Delete all Schedules
router.delete("/", [authenticate], schedules.deleteAll);

export default router;