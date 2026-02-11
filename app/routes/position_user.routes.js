import positionUsers from "../controllers/position_user.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";
var router = Router();

// Create a new PositionUser
router.post("/", [authenticate], positionUsers.create);

// Retrieve all PositionUsers
router.get("/", [authenticate], positionUsers.findAll);

// Retrieve a single PositionUser with id
router.get("/:id", [authenticate], positionUsers.findOne);

// Update a PositionUser with id
router.put("/:id", [authenticate], positionUsers.update);

// Delete a PositionUser with id
router.delete("/:id", [authenticate], positionUsers.delete);

export default router;
