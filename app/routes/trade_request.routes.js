import { Router } from "express";
import authenticate from "../authorization/authorization.js";
import * as tradeRequest from "../controllers/trade_request.controller.js";

const router = Router();

router.post("/", [authenticate], tradeRequest.create);
router.get("/incoming/:user_id", [authenticate], tradeRequest.findIncomingForUser);
router.patch("/:trade_request_id/decline", [authenticate], tradeRequest.decline);
router.patch("/:trade_request_id/accept", [authenticate], tradeRequest.accept);

export default router;
