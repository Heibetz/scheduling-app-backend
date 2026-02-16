import availabilities from "../controllers/availability.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new Availability
router.post("/", [authenticate], availabilities.create);

// Retrieve all Availabilities
router.get("/", [authenticate], availabilities.findAll);

// Retrieve a single Availability with id
router.get("/:id", [authenticate], availabilities.findOne);

// Retrieve all Availabilities for a specific user
router.get("/user/:user_id", [authenticate], availabilities.findByUserId);

// Update an Availability with id
router.put("/:id", [authenticate], availabilities.update);

// Delete an Availability with id
router.delete("/:id", [authenticate], availabilities.delete);

export default router;
