import db from "../models/index.js";
import logger from "../config/logger.js";

const ShiftClaim = db.shiftClaim;
const Shift = db.shift;
const PositionUser = db.positionUser;
const Session = db.session;
const User = db.user;

/** User id from Bearer token (same DB lookup as auth middleware). */
async function getUserIdFromAuthHeader(req) {
  const authHeader = req.get("authorization");
  if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const session = await Session.findOne({ where: { token } });
  if (session == null) return null;
  const user = await User.findOne({ where: { email: session.email } });
  return user?.user_id ?? null;
}

/**
 * Create a pending claim for an open shift (user must hold the shift's position via PositionUser).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function create(req, res) {
  const shift_id = parseInt(req.body?.shift_id, 10);
  const user_id = parseInt(req.body?.user_id, 10);

  if (!shift_id || Number.isNaN(shift_id) || !user_id || Number.isNaN(user_id)) {
    return res.status(400).send({ message: "shift_id and user_id are required." });
  }

  try {
    const shift = await Shift.findByPk(shift_id);
    if (!shift) {
      return res.status(404).send({ message: "Shift not found." });
    }
    if (!shift.is_open || shift.user_id != null) {
      return res.status(400).send({ message: "This shift is not open for claims." });
    }

    const assignment = await PositionUser.findOne({
      where: { user_id, position_id: shift.position_id, is_active: true },
    });
    if (!assignment) {
      return res.status(403).send({
        message: "You are not assigned to this position and cannot claim this shift.",
      });
    }

    const existing = await ShiftClaim.findOne({ where: { shift_id, user_id } });
    if (existing) {
      return res.status(409).send({
        message: "You have already submitted a request for this shift.",
      });
    }

    const claim = await ShiftClaim.create({
      shift_id,
      user_id,
      status: "pending",
    });

    logger.info(`Shift claim created: ${claim.shift_claim_id} shift=${shift_id} user=${user_id}`);
    return res.status(201).send(claim);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send({
        message: "You have already submitted a request for this shift.",
      });
    }
    logger.error(`shift_claim.create: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Could not create claim.",
    });
  }
}

/**
 * List shift claims for a user (e.g. to show "Request sent" on open shifts).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function findByUserId(req, res) {
  const user_id = parseInt(req.params.user_id, 10);
  if (!user_id || Number.isNaN(user_id)) {
    return res.status(400).send({ message: "Valid user_id is required." });
  }

  try {
    const rows = await ShiftClaim.findAll({
      where: { user_id },
      order: [["created_at", "DESC"]],
    });
    return res.send(rows);
  } catch (err) {
    logger.error(`shift_claim.findByUserId: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error retrieving claims." });
  }
}

/** Deletes a pending claim owned by the signed-in user. */
export async function cancelById(req, res) {
  const shift_claim_id = parseInt(req.params.shift_claim_id, 10);
  if (!shift_claim_id || Number.isNaN(shift_claim_id)) {
    return res.status(400).send({ message: "Valid shift_claim_id is required." });
  }

  try {
    const sessionUserId = await getUserIdFromAuthHeader(req);
    if (sessionUserId == null) {
      return res.status(401).send({ message: "Unauthorized." });
    }

    const claim = await ShiftClaim.findByPk(shift_claim_id);
    if (!claim) {
      return res.status(404).send({ message: "Claim not found." });
    }
    if (claim.user_id !== sessionUserId) {
      return res.status(403).send({ message: "You can only cancel your own requests." });
    }
    if (claim.status !== "pending") {
      return res.status(400).send({ message: "Only pending requests can be cancelled." });
    }

    await claim.destroy();
    logger.info(`Shift claim cancelled: ${shift_claim_id} user=${sessionUserId}`);
    return res.status(204).send();
  } catch (err) {
    logger.error(`shift_claim.cancelById: ${err.message}`);
    return res.status(500).send({ message: err.message || "Could not cancel request." });
  }
}
