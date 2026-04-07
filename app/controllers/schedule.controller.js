import db from "../models/index.js";
import logger from "../config/logger.js";

const Schedule = db.schedule;
const Shift = db.shift;
const Area = db.area;
const Notification = db.notification;
const User = db.user;
const Position = db.position;
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

// Create and Save a new Schedule
exports.create = (req, res) => {
  // Validate request
  if (!req.body.area_id || !req.body.start_date || !req.body.end_date) {
    logger.warn('Schedule creation attempt with missing required fields');
    res.status(400).send({
      message: "area_id, start_date, and end_date are required!",
    });
    return;
  }

  // Validate that end_date is after start_date
  if (new Date(req.body.start_date) >= new Date(req.body.end_date)) {
    logger.warn('Schedule creation attempt with invalid date range');
    res.status(400).send({
      message: "end_date must be after start_date!",
    });
    return;
  }

  // Create a Schedule
  const schedule = {
    area_id: req.body.area_id,
    schedule_name: req.body.schedule_name || null,
    start_date: req.body.start_date,
    end_date: req.body.end_date,
  };

  logger.debug(`Creating schedule for area ${schedule.area_id}: ${schedule.start_date} to ${schedule.end_date}`);

  // Save Schedule in the database
  Schedule.create(schedule)
    .then((data) => {
      logger.info(`Schedule created successfully: ${data.schedule_id} for area ${data.area_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating schedule: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Schedule.",
      });
    });
};

// Retrieve all Schedules from the database
exports.findAll = (req, res) => {
  const area_id = req.query.area_id;
  var condition = area_id ? { area_id: { [Op.eq]: area_id } } : null;

  logger.debug(`Fetching all schedules with condition: ${JSON.stringify(condition)}`);

  Schedule.findAll({ 
    where: condition,
    include: [{
      model: Area,
      as: "area",
      attributes: ['area_id', 'area_code', 'area_name']
    }]
  })
    .then((data) => {
      logger.info(`Retrieved ${data.length} schedules`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving schedules: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving schedules.",
      });
    });
};

// Find a single Schedule with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Fetching schedule with id: ${id}`);

  Schedule.findByPk(id, {
    include: [{
      model: Area,
      as: "area",
      attributes: ['area_id', 'area_code', 'area_name']
    }]
  })
    .then((data) => {
      if (data) {
        logger.info(`Schedule found: ${data.schedule_id}`);
        res.send(data);
      } else {
        logger.warn(`Schedule not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find Schedule with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving schedule with id: ${id}. Error: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Schedule with id=" + id,
      });
    });
};

// Find all Schedules by area_id
exports.findByArea = (req, res) => {
  const area_id = req.params.area_id;

  logger.debug(`Fetching schedules for area: ${area_id}`);

  Schedule.findAll({
    where: { area_id: area_id },
    include: [{
      model: Area,
      as: "area",
      attributes: ['area_id', 'area_code', 'area_name']
    }]
  })
    .then((data) => {
      if (data && data.length > 0) {
        logger.info(`Found ${data.length} schedules for area: ${area_id}`);
        res.send(data);
      } else {
        logger.warn(`No schedules found for area: ${area_id}`);
        res.status(404).send({
          message: `Cannot find Schedules for area_id=${area_id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving schedules for area: ${area_id}. Error: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Schedules for area_id=" + area_id,
      });
    });
};

// Update a Schedule by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  // Validate that end_date is after start_date if both are provided
  if (req.body.start_date && req.body.end_date) {
    if (new Date(req.body.start_date) >= new Date(req.body.end_date)) {
      logger.warn(`Schedule update attempt with invalid date range for id: ${id}`);
      res.status(400).send({
        message: "end_date must be after start_date!",
      });
      return;
    }
  }

  logger.debug(`Updating schedule with id: ${id}`);

  Schedule.update(req.body, {
    where: { schedule_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Schedule updated successfully: ${id}`);
        res.send({
          message: "Schedule was updated successfully.",
        });
      } else {
        logger.warn(`Cannot update schedule with id: ${id}. Maybe Schedule was not found or req.body is empty!`);
        res.send({
          message: `Cannot update Schedule with id=${id}. Maybe Schedule was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating schedule with id: ${id}. Error: ${err.message}`);
      res.status(500).send({
        message: "Error updating Schedule with id=" + id,
      });
    });
};

// Delete a Schedule with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;

  logger.debug(`Deleting schedule with id: ${id}`);

  try {
    const deletedShifts = await Shift.destroy({ where: { schedule_id: id } });
    logger.info(`Deleted ${deletedShifts} shifts for schedule: ${id}`);

    const num = await Schedule.destroy({ where: { schedule_id: id } });
    if (num == 1) {
      logger.info(`Schedule deleted successfully: ${id}`);
      res.send({ message: "Schedule was deleted successfully!" });
    } else {
      logger.warn(`Cannot delete schedule with id: ${id}. Maybe Schedule was not found!`);
      res.send({ message: `Cannot delete Schedule with id=${id}. Maybe Schedule was not found!` });
    }
  } catch (err) {
    logger.error(`Error deleting schedule with id: ${id}. Error: ${err.message}`);
    res.status(500).send({ message: "Could not delete Schedule with id=" + id });
  }
};

// Delete all Schedules from the database
exports.deleteAll = (req, res) => {
  logger.debug('Deleting all schedules');

  Schedule.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      logger.info(`${nums} schedules deleted successfully`);
      res.send({ message: `${nums} Schedules were deleted successfully!` });
    })
    .catch((err) => {
      logger.error(`Error deleting all schedules: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while removing all schedules.",
      });
    });
};

// Publish a Schedule (set live) — sends notifications to all assigned workers
exports.publish = async (req, res) => {
  const id = req.params.id;

  logger.debug(`Publishing schedule with id: ${id}`);

  try {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      logger.warn(`Schedule not found for publish: ${id}`);
      return res.status(404).send({ message: `Cannot find Schedule with id=${id}.` });
    }

    if (schedule.status === 'live') {
      return res.status(400).send({ message: "Schedule is already live." });
    }

    // Set status to live
    await Schedule.update({ status: 'live' }, { where: { schedule_id: id } });
    logger.info(`Schedule ${id} published (set live)`);

    // Find all assigned shifts in this schedule and notify workers
    const assignedShifts = await Shift.findAll({
      where: { schedule_id: id, user_id: { [Op.ne]: null } },
      include: [{ model: Position, as: "position", attributes: ['position_name'] }],
    });

    for (const shift of assignedShifts) {
      const posName = shift.position?.position_name || 'a position';
      notify(
        shift.user_id,
        'shift_assigned',
        `You have been assigned a shift on ${formatDate(shift.shift_date)} (${shift.start_time?.slice(0,5)} - ${shift.end_time?.slice(0,5)}) as ${posName}.`,
        shift.shift_id
      );
    }

    logger.info(`Sent ${assignedShifts.length} shift assignment notifications for schedule ${id}`);

    res.send({ message: "Schedule published successfully.", notified: assignedShifts.length });
  } catch (err) {
    logger.error(`Error publishing schedule ${id}: ${err.message}`);
    res.status(500).send({ message: "Error publishing Schedule with id=" + id });
  }
};

export default exports;