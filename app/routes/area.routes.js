import areas from "../controllers/area.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new Area
router.post("/", [authenticate], areas.create);

// Retrieve all Areas
router.get("/", [authenticate], areas.findAll);

// Retrieve a single Area with id
router.get("/:id", [authenticate], areas.findOne);

// Retrieve a single Area by area code
router.get("/code/:code", [authenticate], areas.findByCode);

// Update an Area with id
router.put("/:id", [authenticate], areas.update);

// Delete an Area with id
router.delete("/:id", [authenticate], areas.delete);

// Delete all Areas
router.delete("/", [authenticate], areas.deleteAll);

export default router;
