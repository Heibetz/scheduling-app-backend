import db from "../models/index.js";
import logger from "../config/logger.js";

const Availability = db.availability;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new Availability
exports.create = (req, res) => {
  // Validate request
  if (!req.body.user_id || !req.body.day_of_week || !req.body.start_time || !req.body.end_time) {
    logger.warn('Availability creation attempt with missing required fields');
    res.status(400).send({
      message: "user_id, day_of_week, start_time, and end_time are required!",
    });
    return;
  }

  // Create an Availability
  const availability = {
    user_id: req.body.user_id,
    day_of_week: req.body.day_of_week,
    start_time: req.body.start_time,
    end_time: req.body.end_time,
    is_active: req.body.is_active !== undefined ? req.body.is_active : true,
  };

  logger.debug(`Creating availability for user_id: ${availability.user_id}, day: ${availability.day_of_week}`);

  // Save Availability in the database
  Availability.create(availability)
    .then((data) => {
      logger.info(`Availability created successfully: ${data.availability_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating availability: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Availability.",
      });
    });
};

// Retrieve all Availabilities from the database
exports.findAll = (req, res) => {
  const user_id = req.query.user_id;
  var condition = user_id ? { user_id: { [Op.eq]: user_id } } : null;

  logger.debug(`Fetching all availabilities with condition: ${JSON.stringify(condition)}`);

  Availability.findAll({ where: condition })
    .then((data) => {
      logger.info(`Retrieved ${data.length} availabilities`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving availabilities: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving availabilities.",
      });
    });
};

// Find a single Availability with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding availability with id: ${id}`);

  Availability.findByPk(id)
    .then((data) => {
      if (data) {
        logger.info(`Availability found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`Availability not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find Availability with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving availability ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Availability with id=" + id,
      });
    });
};

// Find all Availabilities for a specific user
exports.findByUserId = (req, res) => {
  const user_id = req.params.user_id;

  logger.debug(`Finding availabilities for user_id: ${user_id}`);

  Availability.findAll({
    where: {
      user_id: user_id,
    },
  })
    .then((data) => {
      logger.info(`Retrieved ${data.length} availabilities for user ${user_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving availabilities for user ${user_id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Availabilities for user_id=" + user_id,
      });
    });
};

// Update an Availability by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating availability ${id} with data: ${JSON.stringify(req.body)}`);

  Availability.update(req.body, {
    where: { availability_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Availability ${id} updated successfully`);
        res.send({
          message: "Availability was updated successfully.",
        });
      } else {
        logger.warn(`Failed to update availability ${id} - not found or empty body`);
        res.send({
          message: `Cannot update Availability with id=${id}. Maybe Availability was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating availability ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error updating Availability with id=" + id,
      });
    });
};

// Delete an Availability with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  logger.debug(`Attempting to delete availability: ${id}`);

  Availability.destroy({
    where: { availability_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Availability ${id} deleted successfully`);
        res.send({
          message: "Availability was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete availability ${id} - not found`);
        res.send({
          message: `Cannot delete Availability with id=${id}. Maybe Availability was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting availability ${id}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete Availability with id=" + id,
      });
    });
};

export default exports;
