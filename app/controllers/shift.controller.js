import db from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const Notification = db.notification;
const Schedule = db.schedule;
const Position = db.position;
const PositionUser = db.positionUser;
const User = db.user;
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

// Create and Save a new Shift
exports.create = (req, res) => {
  // Validate request
  if (!req.body.schedule_id || !req.body.position_id || !req.body.shift_date || !req.body.start_time || !req.body.end_time || !req.body.created_by) {
    logger.warn('Shift creation attempt with missing required fields');
    res.status(400).send({
      message: "schedule_id, position_id, shift_date, start_time, end_time, and created_by are required!",
    });
    return;
  }

  // Create a Shift
  const shift = {
    schedule_id: req.body.schedule_id,
    position_id: req.body.position_id,
    user_id: req.body.user_id || null,
    shift_date: req.body.shift_date,
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    is_open: req.body.is_open !== undefined ? req.body.is_open : true,
    assignment_type: req.body.assignment_type || null,
    status: req.body.status || null,
    assigned_by: req.body.assigned_by || null,
    assigned_at: req.body.assigned_at || null,
    confirmed_at: req.body.confirmed_at || null,
    created_by: req.body.created_by,
  };

  logger.debug(`Creating shift for schedule_id: ${shift.schedule_id}, position_id: ${shift.position_id}`);

  // Save Shift in the database
  Shift.create(shift)
    .then((data) => {
      logger.info(`Shift created successfully: ${data.shift_id}`);
      // Notify assigned worker
      if (data.user_id) {
        notify(
          data.user_id,
          'shift_assigned',
          `You have been assigned a shift on ${formatDate(data.shift_date)} (${data.start_time?.slice(0,5)} - ${data.end_time?.slice(0,5)}).`,
          data.shift_id
        );
      }
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating shift: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Shift.",
      });
    });
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

export default exports;
