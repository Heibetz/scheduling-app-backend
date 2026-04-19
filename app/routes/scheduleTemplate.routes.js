import templates from "../controllers/scheduleTemplate.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

const router = Router();

// ── Template CRUD ──────────────────────────────────────────
router.post("/", [authenticate], templates.create);
router.get("/", [authenticate], templates.findAll);
router.get("/:id", [authenticate], templates.findOne);
router.put("/:id", [authenticate], templates.update);
router.delete("/:id", [authenticate], templates.delete);

// ── Template Shift CRUD ────────────────────────────────────
router.post("/:id/shifts", [authenticate], templates.createShift);
router.put("/:id/shifts/:shiftId", [authenticate], templates.updateShift);
router.delete("/:id/shifts/:shiftId", [authenticate], templates.deleteShift);

// ── Template Shift Task CRUD ───────────────────────────────
router.post("/:id/shifts/:shiftId/tasks", [authenticate], templates.createShiftTask);
router.delete("/:id/shifts/:shiftId/tasks/:taskId", [authenticate], templates.deleteShiftTask);

// ── Apply template → create draft schedule ─────────────────
router.post("/:id/apply", [authenticate], templates.apply);

export default router;
