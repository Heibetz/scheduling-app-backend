import db from "../models/index.js";
import logger from "../config/logger.js";

const Shift = db.shift;
const Op = db.Sequelize.Op;
const exports = {};

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
exports.update = (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating shift ${id} with data: ${JSON.stringify(req.body)}`);

  Shift.update(req.body, {
    where: { shift_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Shift ${id} updated successfully`);
        res.send({
          message: "Shift was updated successfully.",
        });
      } else {
        logger.warn(`Failed to update shift ${id} - not found or empty body`);
        res.send({
          message: `Cannot update Shift with id=${id}. Maybe Shift was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating shift ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error updating Shift with id=" + id,
      });
    });
};

// Delete a Shift with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  logger.debug(`Attempting to delete shift: ${id}`);

  Shift.destroy({
    where: { shift_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Shift ${id} deleted successfully`);
        res.send({
          message: "Shift was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete shift ${id} - not found`);
        res.send({
          message: `Cannot delete Shift with id=${id}. Maybe Shift was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting shift ${id}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete Shift with id=" + id,
      });
    });
};

export default exports;
