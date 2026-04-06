import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import * as shiftClaim from "../controllers/shift_claim.controller.js";

const router = Router();

router.post("/", [authenticate], shiftClaim.create);
router.post("/cancel/:shift_claim_id", [authenticate], shiftClaim.cancelById);
router.get("/user/:user_id", [authenticate], shiftClaim.findByUserId);

export default router;
