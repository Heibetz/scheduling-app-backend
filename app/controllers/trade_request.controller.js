import db from "../models/index.js";
import logger from "../config/logger.js";

const TradeRequest = db.tradeRequest;
const Shift = db.shift;
const User = db.user;
const Position = db.position;
const Area = db.area;
const PositionUser = db.positionUser;
const Session = db.session;

/**
 * Resolve signed-in user id from Bearer token.
 * @param {import('express').Request} req
 * @returns {Promise<number|null>}
 */
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
 * Create a private trade request (sender offers one of their assigned shifts to a specific worker).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function create(req, res) {
  const to_user_id = parseInt(req.body?.to_user_id, 10);
  const offered_shift_id = parseInt(req.body?.offered_shift_id, 10);
  const message = req.body?.message != null ? String(req.body.message) : null;

  if (!to_user_id || Number.isNaN(to_user_id) || !offered_shift_id || Number.isNaN(offered_shift_id)) {
    return res.status(400).send({ message: "to_user_id and offered_shift_id are required." });
  }

  try {
    const sessionUserId = await getUserIdFromAuthHeader(req);
    if (sessionUserId == null) {
      return res.status(401).send({ message: "Unauthorized." });
    }
    if (Number(to_user_id) === Number(sessionUserId)) {
      return res.status(400).send({ message: "You cannot send a trade request to yourself." });
    }

    const toUser = await User.findByPk(to_user_id);
    if (!toUser) {
      return res.status(404).send({ message: "Recipient user not found." });
    }

    const shift = await Shift.findByPk(offered_shift_id);
    if (!shift) {
      return res.status(404).send({ message: "Shift not found." });
    }
    if (shift.user_id == null || Number(shift.user_id) !== Number(sessionUserId)) {
      return res.status(403).send({ message: "You can only offer shifts assigned to you." });
    }

    const recipientPu = await PositionUser.findOne({
      where: { user_id: to_user_id, position_id: shift.position_id, is_active: true },
    });
    if (!recipientPu) {
      return res.status(400).send({
        message: "The recipient must be assigned to the same position as this shift.",
      });
    }

    const dup = await TradeRequest.findOne({
      where: {
        from_user_id: sessionUserId,
        to_user_id,
        offered_shift_id,
        status: "pending",
      },
    });
    if (dup) {
      return res.status(409).send({ message: "A pending trade request for this shift already exists." });
    }

    const row = await TradeRequest.create({
      from_user_id: sessionUserId,
      to_user_id,
      offered_shift_id,
      status: "pending",
      message,
    });

    return res.status(201).send({
      trade_request_id: row.trade_request_id,
      message: "Trade request sent.",
    });
  } catch (err) {
    logger.error(`trade_request.create: ${err.message}`);
    return res.status(500).send({ message: err.message || "Could not create trade request." });
  }
}

/**
 * Pending trade requests sent directly to this worker.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function findIncomingForUser(req, res) {
  const userId = parseInt(req.params.user_id, 10);
  if (!userId || Number.isNaN(userId)) {
    return res.status(400).send({ message: "Valid user_id is required." });
  }

  try {
    const sessionUserId = await getUserIdFromAuthHeader(req);
    if (sessionUserId == null) {
      return res.status(401).send({ message: "Unauthorized." });
    }
    if (Number(sessionUserId) !== userId) {
      return res.status(403).send({ message: "Forbidden." });
    }

    const rows = await TradeRequest.findAll({
      where: { to_user_id: userId, status: "pending" },
      include: [
        {
          model: User,
          as: "fromUser",
          attributes: ["user_id", "fName", "lName", "email"],
        },
        {
          model: Shift,
          as: "offeredShift",
          required: true,
          include: [
            {
              model: Position,
              as: "position",
              required: true,
              include: [{ model: Area, as: "area" }],
            },
          ],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const tradeRequests = rows.map((r) => {
      const plain = r.get({ plain: true });
      const pos = plain.offeredShift?.position;
      return {
        trade_request_id: plain.trade_request_id,
        from_user_id: plain.from_user_id,
        to_user_id: plain.to_user_id,
        status: plain.status,
        message: plain.message,
        created_at: plain.created_at,
        from_user: plain.fromUser
          ? {
              user_id: plain.fromUser.user_id,
              fName: plain.fromUser.fName,
              lName: plain.fromUser.lName,
              email: plain.fromUser.email,
            }
          : null,
        shift: plain.offeredShift
          ? {
              shift_id: plain.offeredShift.shift_id,
              shift_date: plain.offeredShift.shift_date,
              start_time: plain.offeredShift.start_time,
              end_time: plain.offeredShift.end_time,
              position_name: pos?.position_name ?? null,
              area_name: pos?.area?.area_name ?? null,
            }
          : null,
      };
    });

    return res.send({ tradeRequests });
  } catch (err) {
    logger.error(`trade_request.findIncomingForUser: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Error retrieving trade requests.",
    });
  }
}

/**
 * Decline a pending trade request (recipient only).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function decline(req, res) {
  const id = parseInt(req.params.trade_request_id, 10);
  if (!id || Number.isNaN(id)) {
    return res.status(400).send({ message: "Valid trade_request_id is required." });
  }

  try {
    const sessionUserId = await getUserIdFromAuthHeader(req);
    if (sessionUserId == null) {
      return res.status(401).send({ message: "Unauthorized." });
    }

    const row = await TradeRequest.findByPk(id);
    if (!row) {
      return res.status(404).send({ message: "Trade request not found." });
    }
    if (Number(row.to_user_id) !== Number(sessionUserId)) {
      return res.status(403).send({ message: "Forbidden." });
    }
    if (row.status !== "pending") {
      return res.status(400).send({ message: "Only pending requests can be declined." });
    }

    row.status = "declined";
    await row.save();
    return res.send({ message: "Trade request declined.", trade_request_id: id });
  } catch (err) {
    logger.error(`trade_request.decline: ${err.message}`);
    return res.status(500).send({ message: err.message || "Could not decline request." });
  }
}

/**
 * Accept a pending trade request (recipient only). Marks request accepted; shift reassignment can be added later.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function accept(req, res) {
  const id = parseInt(req.params.trade_request_id, 10);
  if (!id || Number.isNaN(id)) {
    return res.status(400).send({ message: "Valid trade_request_id is required." });
  }

  try {
    const sessionUserId = await getUserIdFromAuthHeader(req);
    if (sessionUserId == null) {
      return res.status(401).send({ message: "Unauthorized." });
    }

    const row = await TradeRequest.findByPk(id);
    if (!row) {
      return res.status(404).send({ message: "Trade request not found." });
    }
    if (Number(row.to_user_id) !== Number(sessionUserId)) {
      return res.status(403).send({ message: "Forbidden." });
    }
    if (row.status !== "pending") {
      return res.status(400).send({ message: "Only pending requests can be accepted." });
    }

    row.status = "accepted";
    await row.save();
    return res.send({ message: "Trade request accepted.", trade_request_id: id });
  } catch (err) {
    logger.error(`trade_request.accept: ${err.message}`);
    return res.status(500).send({ message: err.message || "Could not accept request." });
  }
}

/**
 * Count pending trade requests for a user (for dashboard badge).
 * @param {number} userId
 */
export async function countPendingForUser(userId) {
  return TradeRequest.count({
    where: { to_user_id: userId, status: "pending" },
  });
}
