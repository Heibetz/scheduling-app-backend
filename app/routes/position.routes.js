import positions from "../controllers/position.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new Position
router.post("/", [authenticate], positions.create);

// Retrieve all Positions
router.get("/", [authenticate], positions.findAll);

// Retrieve a single Position with id
router.get("/:id", [authenticate], positions.findOne);

// Update a Position with id
router.put("/:id", [authenticate], positions.update);

// Delete a Position with id
router.delete("/:id", [authenticate], positions.delete);

export default router;
