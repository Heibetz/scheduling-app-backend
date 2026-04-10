import db from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const Notification = db.notification;
const Schedule = db.schedule;
const Position = db.position;
const PositionUser = db.positionUser;
const User = db.user;
const Area = db.area;
const ShiftActivity = db.shiftActivity;
const Op = db.Sequelize.Op;
const exports = {};

// ── helpers ──────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[dt.getUTCDay()]}, ${months[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
};

const notify = (userId, type, message, shiftId) => {
  Notification.create({
    user_id: userId,
    type,
    message,
    related_shift_id: shiftId || null,
    is_read: false,
  }).catch(err => logger.error(`Notification create failed: ${err.message}`));
};

const findAreaManagerIds = async (scheduleId) => {
  try {
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) return [];
    const mgrPositions = await Position.findAll({
      where: { area_id: schedule.area_id, is_manager: true },
    });
    if (!mgrPositions.length) return [];
    const pus = await PositionUser.findAll({
      where: { position_id: mgrPositions.map(p => p.position_id) },
    });
    return [...new Set(pus.map(pu => pu.user_id))];
  } catch (e) {
    logger.error(`findAreaManagerIds error: ${e.message}`);
    return [];
  }
};

/** User id from Bearer token (session lookup). */
const getUserIdFromAuthHeader = async (req) => {
  const authHeader = req.get("authorization");
  if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const session = await db.session.findOne({ where: { token } });
  if (session == null) return null;
  const user = await User.findOne({ where: { email: session.email } });
  return user?.user_id ?? null;
};

/**
 * Write an audit row to `shift_activity` (best-effort; failures are logged but do not block the request).
 * @param {number} shiftId
 * @param {number} userId
 * @param {string} action
 * @param {string|null} [note]
 */
const logShiftActivity = (shiftId, userId, action, note = null) => {
  if (!ShiftActivity) return;
  ShiftActivity.create({
    shift_id: shiftId,
    user_id: userId,
    action,
    note,
  }).catch((err) => logger.error(`ShiftActivity create failed: ${err.message}`));
};

// Create and Save a new Shift
exports.create = async (req, res) => {
  try {
    const sessionUserId = await getUserIdFromAuthHeader(req);
    if (sessionUserId == null) {
      return res.status(401).send({ message: "Unauthorized." });
    }

    // If a shift is created unassigned (user_id missing/null), it should automatically be posted as open.
    // If a shift is created assigned (user_id provided), it should not be open.
    const isUnassigned = req.body.user_id == null || req.body.user_id === "";
    const isOpenPost = isUnassigned;

    // Validate request
    // - schedule_id/position_id/date/time are always required
    // - created_by is only required for non-open-post flows (open posts derive created_by from session)
    const missingBase =
      !req.body.schedule_id ||
      !req.body.position_id ||
      !req.body.shift_date ||
      !req.body.start_time ||
      !req.body.end_time;
    const missingCreatedBy = !isOpenPost && !req.body.created_by;
    if (missingBase || missingCreatedBy) {
      logger.warn('Shift creation attempt with missing required fields');
      return res.status(400).send({
        message: isOpenPost
          ? "schedule_id, position_id, shift_date, start_time, and end_time are required!"
          : "schedule_id, position_id, shift_date, start_time, end_time, and created_by are required!",
      });
    }
    if (isOpenPost) {
      const pos = await Position.findByPk(req.body.position_id);
      const areaId = pos?.area_id ?? null;
      const allowed = (await isSuperAdmin(sessionUserId)) || (await isManagerForArea(sessionUserId, areaId));
      if (!allowed) {
        return res.status(403).send({ message: "Only managers can post open shifts." });
      }
    }

    // Create a Shift (force created_by from session for open-posts)
    const shift = {
      schedule_id: req.body.schedule_id,
      position_id: req.body.position_id,
      user_id: req.body.user_id || null,
      shift_date: req.body.shift_date,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      is_open: isUnassigned ? true : false,
      assignment_type: req.body.assignment_type || null,
      status: req.body.status || null,
      assigned_by: req.body.assigned_by || null,
      assigned_at: req.body.assigned_at || null,
      confirmed_at: req.body.confirmed_at || null,
      created_by: isOpenPost ? sessionUserId : req.body.created_by,
    };

    logger.debug(`Creating shift for schedule_id: ${shift.schedule_id}, position_id: ${shift.position_id}`);

    // Save Shift in the database
    const data = await Shift.create(shift);
    logger.info(`Shift created successfully: ${data.shift_id}`);

    if (isOpenPost) {
      logShiftActivity(data.shift_id, sessionUserId, "posted");
    }

    // Notify assigned worker
    if (data.user_id) {
      notify(
        data.user_id,
        'shift_assigned',
        `You have been assigned a shift on ${formatDate(data.shift_date)} (${data.start_time?.slice(0,5)} - ${data.end_time?.slice(0,5)}).`,
        data.shift_id
      );
    }
    return res.send(data);
  } catch (err) {
    logger.error(`Error creating shift: ${err.message}`);
    return res.status(500).send({
      message: err.message || "Some error occurred while creating the Shift.",
    });
  }
};

const isSuperAdmin = async (userId) => {
  if (!userId) return false;
  const u = await User.findByPk(userId);
  return !!u?.is_super_admin;
};

const isManagerForArea = async (userId, areaId) => {
  if (!userId || !areaId) return false;
  const mgrPositions = await Position.findAll({
    attributes: ["position_id"],
    where: { area_id: areaId, is_manager: true },
  });
  if (!mgrPositions.length) return false;
  const assignment = await PositionUser.findOne({
    where: {
      user_id: userId,
      position_id: mgrPositions.map((p) => p.position_id),
      is_active: true,
    },
  });
  return !!assignment;
};

// Retrieve all Shifts from the database
exports.findAll = (req, res) => {
  const schedule_id = req.query.schedule_id;
  const position_id = req.query.position_id;
  const user_id = req.query.user_id;
  const status = req.query.status;
  
  var condition = {};
  if (schedule_id) condition.schedule_id = { [Op.eq]: schedule_id };
  if (position_id) condition.position_id = { [Op.eq]: position_id };
  if (user_id) condition.user_id = { [Op.eq]: user_id };
  if (status) condition.status = { [Op.eq]: status };

  logger.debug(`Fetching all shifts with condition: ${JSON.stringify(condition)}`);

  Shift.findAll({ where: Object.keys(condition).length > 0 ? condition : null })
    .then((data) => {
      logger.info(`Retrieved ${data.length} shifts`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving shifts: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving shifts.",
      });
    });
};

// Find a single Shift with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding shift with id: ${id}`);

  Shift.findByPk(id)
    .then((data) => {
      if (data) {
        logger.info(`Shift found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`Shift not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find Shift with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving shift ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Shift with id=" + id,
      });
    });
};

// Find all Shifts for a specific schedule
exports.findByScheduleId = (req, res) => {
  const schedule_id = req.params.schedule_id;

  logger.debug(`Finding shifts for schedule_id: ${schedule_id}`);

  Shift.findAll({
    where: {
      schedule_id: schedule_id,
    },
  })
    .then((data) => {
      logger.info(`Retrieved ${data.length} shifts for schedule ${schedule_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving shifts for schedule ${schedule_id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Shifts for schedule_id=" + schedule_id,
      });
    });
};

// Find all Shifts for a specific user
exports.findByUserId = (req, res) => {
  const user_id = req.params.user_id;

  logger.debug(`Finding shifts for user_id: ${user_id}`);

  Shift.findAll({
    where: {
      user_id: user_id,
    },
  })
    .then((data) => {
      logger.info(`Retrieved ${data.length} shifts for user ${user_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving shifts for user ${user_id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Shifts for user_id=" + user_id,
      });
    });
};

// Update a Shift by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating shift ${id} with data: ${JSON.stringify(req.body)}`);

  try {
    const sessionUserId = await getUserIdFromAuthHeader(req);
    // Fetch old shift before updating
    const oldShift = await Shift.findByPk(id);
    if (!oldShift) {
      return res.send({ message: `Cannot update Shift with id=${id}. Maybe Shift was not found!` });
    }

    const [num] = await Shift.update(req.body, { where: { shift_id: id } });
    if (num !== 1) {
      return res.send({ message: `Cannot update Shift with id=${id}. Maybe Shift was not found or req.body is empty!` });
    }

    logger.info(`Shift ${id} updated successfully`);

    // Fetch updated shift
    const newShift = await Shift.findByPk(id);

    // ── Shift offer / cancel offer (worker) ──
    if (sessionUserId && req.body.is_open !== undefined && newShift.user_id === sessionUserId) {
      const oldOpen = !!oldShift.is_open;
      const newOpen = !!newShift.is_open;
      if (!oldOpen && newOpen) {
        logShiftActivity(newShift.shift_id, sessionUserId, "offered");
      } else if (oldOpen && !newOpen) {
        logShiftActivity(newShift.shift_id, sessionUserId, "offer_cancelled");
      }
    }

    // ── Notify on confirmation ──
    if (req.body.status === 'confirmed' && oldShift.status !== 'confirmed' && newShift.user_id) {
      const worker = await User.findByPk(newShift.user_id);
      const workerName = worker ? `${worker.fName} ${worker.lName}` : 'A worker';
      const mgrIds = await findAreaManagerIds(newShift.schedule_id);
      mgrIds.forEach(mgrId => {
        notify(
          mgrId,
          'shift_confirmed',
          `${workerName} confirmed their shift on ${formatDate(newShift.shift_date)} (${newShift.start_time?.slice(0,5)} - ${newShift.end_time?.slice(0,5)}).`,
          newShift.shift_id
        );
      });
    }

    // ── Notify on cancellation ──
    if (req.body.status === 'cancelled' && oldShift.status !== 'cancelled') {
      if (oldShift.user_id) {
        notify(
          oldShift.user_id,
          'shift_cancelled',
          `Your shift on ${formatDate(oldShift.shift_date)} (${oldShift.start_time?.slice(0,5)} - ${oldShift.end_time?.slice(0,5)}) has been cancelled.`,
          newShift.shift_id
        );
      }
      const mgrIds = await findAreaManagerIds(newShift.schedule_id);
      const worker = oldShift.user_id ? await User.findByPk(oldShift.user_id) : null;
      const workerName = worker ? `${worker.fName} ${worker.lName}` : 'A worker';
      mgrIds.forEach(mgrId => {
        if (mgrId !== oldShift.user_id) {
          notify(
            mgrId,
            'shift_cancelled',
            `${workerName}'s shift on ${formatDate(oldShift.shift_date)} (${oldShift.start_time?.slice(0,5)} - ${oldShift.end_time?.slice(0,5)}) has been cancelled.`,
            newShift.shift_id
          );
        }
      });
    }

    // ── Notify on time/date change ──
    const timeChanged = (req.body.start_time && req.body.start_time !== oldShift.start_time) ||
                        (req.body.end_time && req.body.end_time !== oldShift.end_time) ||
                        (req.body.shift_date && req.body.shift_date !== oldShift.shift_date?.toString()?.slice(0,10));
    if (timeChanged && newShift.user_id && req.body.status !== 'cancelled') {
      notify(
        newShift.user_id,
        'shift_changed',
        `Your shift on ${formatDate(oldShift.shift_date)} has been updated to ${formatDate(newShift.shift_date)} (${newShift.start_time?.slice(0,5)} - ${newShift.end_time?.slice(0,5)}).`,
        newShift.shift_id
      );
    }

    // ── Notify on reassignment ──
    if (req.body.user_id && oldShift.user_id && req.body.user_id !== oldShift.user_id) {
      notify(
        oldShift.user_id,
        'shift_unassigned',
        `You have been removed from the shift on ${formatDate(oldShift.shift_date)} (${oldShift.start_time?.slice(0,5)} - ${oldShift.end_time?.slice(0,5)}).`,
        newShift.shift_id
      );
      notify(
        req.body.user_id,
        'shift_assigned',
        `You have been assigned a shift on ${formatDate(newShift.shift_date)} (${newShift.start_time?.slice(0,5)} - ${newShift.end_time?.slice(0,5)}).`,
        newShift.shift_id
      );
    }

    // ── Notify on new assignment (was unassigned) ──
    if (req.body.user_id && !oldShift.user_id) {
      notify(
        req.body.user_id,
        'shift_assigned',
        `You have been assigned a shift on ${formatDate(newShift.shift_date)} (${newShift.start_time?.slice(0,5)} - ${newShift.end_time?.slice(0,5)}).`,
        newShift.shift_id
      );
    }

    res.send({ message: "Shift was updated successfully." });
  } catch (err) {
    logger.error(`Error updating shift ${id}: ${err.message}`);
    res.status(500).send({ message: "Error updating Shift with id=" + id });
  }
};

// Delete a Shift with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  logger.debug(`Attempting to delete shift: ${id}`);

  try {
    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.send({ message: `Cannot delete Shift with id=${id}. Maybe Shift was not found!` });
    }

    // Notify assigned worker before destroying
    if (shift.user_id) {
      notify(
        shift.user_id,
        'shift_cancelled',
        `Your shift on ${formatDate(shift.shift_date)} (${shift.start_time?.slice(0,5)} - ${shift.end_time?.slice(0,5)}) has been cancelled.`,
        null
      );
    }

    await Shift.destroy({ where: { shift_id: id } });
    logger.info(`Shift ${id} deleted successfully`);
    res.send({ message: "Shift was deleted successfully!" });
  } catch (err) {
    logger.error(`Error deleting shift ${id}: ${err.message}`);
    res.status(500).send({ message: "Could not delete Shift with id=" + id });
  }
};

/**
 * Open shifts for student dashboard: is_open, unassigned, shift_date from today onward.
 * Only shifts whose `position_id` is in the caller's PositionUser rows (active) — uses `IN (...)`
 * so multiple positions / areas per user are supported.
 * Response body: `{ shifts: Array<shift & { area_id, area_name, position_name }> }`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.findOpenForStudent = async (req, res) => {
  const userId = parseInt(req.params.user_id, 10);
  if (!userId || Number.isNaN(userId)) {
    return res.status(400).send({ message: "Valid user_id is required." });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const assignments = await PositionUser.findAll({
      attributes: ["position_id"],
      where: { user_id: userId, is_active: true },
    });

    const positionIds = [
      ...new Set(
        assignments.map((pu) => pu.position_id).filter((id) => id != null)
      ),
    ];

    if (positionIds.length === 0) {
      return res.send({ shifts: [] });
    }

    const rows = await Shift.findAll({
      where: {
        is_open: true,
        shift_date: { [Op.gte]: startOfToday },
        position_id: { [Op.in]: positionIds },
        // Offered shifts keep user_id (original owner) but are still open.
      },
      include: [
        {
          model: Position,
          as: "position",
          required: true,
          include: [{ model: Area, as: "area" }],
        },
      ],
      order: [
        ["shift_date", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    // Determine "source" for each shift (manager vs worker), based on who created it.
    const creatorIds = [
      ...new Set(rows.map((s) => s.created_by).filter((id) => id != null)),
    ];

    const superAdminCreatorIds = new Set();
    const managerCreatorIds = new Set();

    if (creatorIds.length) {
      const creators = await User.findAll({
        attributes: ["user_id", "is_super_admin"],
        where: { user_id: { [Op.in]: creatorIds } },
      });
      for (const u of creators) {
        if (u.is_super_admin) superAdminCreatorIds.add(u.user_id);
      }

      // Any user who holds an active manager position counts as "manager" source.
      const managerPositions = await Position.findAll({
        attributes: ["position_id"],
        where: { is_manager: true },
      });
      const managerPositionIds = managerPositions.map((p) => p.position_id);
      if (managerPositionIds.length) {
        const managerAssignments = await PositionUser.findAll({
          attributes: ["user_id"],
          where: {
            user_id: { [Op.in]: creatorIds },
            position_id: { [Op.in]: managerPositionIds },
            is_active: true,
          },
        });
        for (const pu of managerAssignments) {
          managerCreatorIds.add(pu.user_id);
        }
      }
    }

    const payload = rows.map((s) => {
      const plain = s.get({ plain: true });
      const pos = plain.position;
      const createdBy = plain.created_by;
      const source =
        createdBy != null &&
        (superAdminCreatorIds.has(createdBy) || managerCreatorIds.has(createdBy))
          ? "manager"
          : "worker";
      return {
        ...plain,
        area_id: pos?.area_id ?? null,
        area_name: pos?.area?.area_name ?? null,
        position_name: pos?.position_name ?? null,
        source,
      };
    });

    res.send({ shifts: payload });
  } catch (err) {
    logger.error(`findOpenForStudent: ${err.message}`);
    res.status(500).send({
      message: err.message || "Error retrieving open shifts.",
    });
  }
};

/**
 * Open shifts for manager dashboard: all open shifts in the manager's area(s).
 * Area(s) are determined by active PositionUser rows for manager positions (Position.is_manager=1).
 */
exports.findOpenForManager = async (req, res) => {
  const userId = parseInt(req.params.user_id, 10);
  if (!userId || Number.isNaN(userId)) {
    return res.status(400).send({ message: "Valid user_id is required." });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const managerPositions = await Position.findAll({
      attributes: ["position_id", "area_id"],
      where: { is_manager: true },
    });
    const managerPositionIds = managerPositions.map((p) => p.position_id);
    if (!managerPositionIds.length) return res.send({ shifts: [] });

    const myManagerAssignments = await PositionUser.findAll({
      attributes: ["position_id"],
      where: { user_id: userId, is_active: true, position_id: { [Op.in]: managerPositionIds } },
    });
    const myManagerPositionIds = myManagerAssignments.map((pu) => pu.position_id);
    const myAreaIds = [
      ...new Set(
        managerPositions
          .filter((p) => myManagerPositionIds.includes(p.position_id))
          .map((p) => p.area_id)
      ),
    ];
    if (!myAreaIds.length) {
      return res.send({ shifts: [] });
    }

    const rows = await Shift.findAll({
      where: {
        is_open: true,
        shift_date: { [Op.gte]: startOfToday },
      },
      include: [
        {
          model: Position,
          as: "position",
          required: true,
          where: { area_id: { [Op.in]: myAreaIds } },
          include: [{ model: Area, as: "area" }],
        },
      ],
      order: [
        ["shift_date", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    const creatorIds = [
      ...new Set(rows.map((s) => s.created_by).filter((id) => id != null)),
    ];
    const superAdminCreatorIds = new Set();
    const managerCreatorIds = new Set();
    if (creatorIds.length) {
      const creators = await User.findAll({
        attributes: ["user_id", "is_super_admin"],
        where: { user_id: { [Op.in]: creatorIds } },
      });
      for (const u of creators) {
        if (u.is_super_admin) superAdminCreatorIds.add(u.user_id);
      }
      const managerAssignments = await PositionUser.findAll({
        attributes: ["user_id"],
        where: {
          user_id: { [Op.in]: creatorIds },
          position_id: { [Op.in]: managerPositionIds },
          is_active: true,
        },
      });
      for (const pu of managerAssignments) {
        managerCreatorIds.add(pu.user_id);
      }
    }

    const payload = rows.map((s) => {
      const plain = s.get({ plain: true });
      const pos = plain.position;
      const createdBy = plain.created_by;
      const source =
        createdBy != null &&
        (superAdminCreatorIds.has(createdBy) || managerCreatorIds.has(createdBy))
          ? "manager"
          : "worker";
      return {
        ...plain,
        area_id: pos?.area_id ?? null,
        area_name: pos?.area?.area_name ?? null,
        position_name: pos?.position_name ?? null,
        source,
      };
    });

    return res.send({ shifts: payload });
  } catch (err) {
    logger.error(`findOpenForManager: ${err.message}`);
    return res.status(500).send({ message: err.message || "Error retrieving open shifts." });
  }
};

/**
 * Claim an open shift instantly (no approval).
 * - If shift is already claimed/not open: 409
 * - Sets user_id to claimant, is_open=0, assigned_by=user_id, assigned_at=now
 * - Requires claimant to have PositionUser assignment for shift.position_id
 */
exports.claimOpenShift = async (req, res) => {
  const shiftId = parseInt(req.params.id, 10);
  if (!shiftId || Number.isNaN(shiftId)) {
    return res.status(400).send({ message: "Valid shift id is required." });
  }

  try {
    const claimantId = await getUserIdFromAuthHeader(req);
    if (claimantId == null) {
      return res.status(401).send({ message: "Unauthorized." });
    }

    const t = await db.sequelize.transaction();
    try {
      const shift = await Shift.findByPk(shiftId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!shift) {
        await t.rollback();
        return res.status(404).send({ message: "Shift not found." });
      }

      if (!shift.is_open) {
        await t.rollback();
        return res.status(409).send({ message: "Shift has already been claimed." });
      }

      if (shift.user_id != null && Number(shift.user_id) === Number(claimantId)) {
        await t.rollback();
        return res.status(400).send({ message: "You cannot claim your own offered shift." });
      }

      const assignment = await PositionUser.findOne({
        where: { user_id: claimantId, position_id: shift.position_id, is_active: true },
        transaction: t,
        lock: t.LOCK.KEY_SHARE,
      });
      if (!assignment) {
        await t.rollback();
        return res.status(403).send({ message: "You are not assigned to this position." });
      }

      // If this shift was offered by another worker, overwriting user_id removes it from their schedule.
      shift.user_id = claimantId;
      shift.is_open = false;
      shift.assigned_by = claimantId;
      shift.assigned_at = new Date();
      shift.status = "assigned";
      shift.assignment_type = "claim";

      await shift.save({ transaction: t });
      await t.commit();

      logShiftActivity(shift.shift_id, claimantId, "claimed");
      return res.send({ message: "Shift claimed", shift_id: shift.shift_id });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    logger.error(`claimOpenShift: ${err.message}`);
    return res.status(500).send({ message: err.message || "Could not claim shift." });
  }
};


export default exports;
