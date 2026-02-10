import db from "../models/index.js";
import logger from "../config/logger.js";

const Area = db.area;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new Area
exports.create = (req, res) => {
  // Validate request
  if (!req.body.area_code || !req.body.area_name) {
    logger.warn('Area creation attempt with missing required fields');
    res.status(400).send({
      message: "Area code and area name are required!",
    });
    return;
  }

  // Create an Area
  const area = {
    area_code: req.body.area_code,
    area_name: req.body.area_name,
  };

  logger.debug(`Creating area: ${area.area_code} - ${area.area_name}`);

  // Save Area in the database
  Area.create(area)
    .then((data) => {
      logger.info(`Area created successfully: ${data.area_id} - ${data.area_code}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating area: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Area.",
      });
    });
};

// Retrieve all Areas from the database
exports.findAll = (req, res) => {
  const area_code = req.query.area_code;
  var condition = area_code ? { area_code: { [Op.like]: `%${area_code}%` } } : null;

  logger.debug(`Fetching all areas with condition: ${JSON.stringify(condition)}`);

  Area.findAll({ where: condition })
    .then((data) => {
      logger.info(`Retrieved ${data.length} areas`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving areas: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving areas.",
      });
    });
};

// Find a single Area with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding area with id: ${id}`);

  Area.findByPk(id)
    .then((data) => {
      if (data) {
        logger.info(`Area found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`Area not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find Area with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving area with id=${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Area with id=" + id,
      });
    });
};

// Find a single Area by area code
exports.findByCode = (req, res) => {
  const code = req.params.code;

  logger.debug(`Finding area with code: ${code}`);

  Area.findOne({ where: { area_code: code } })
    .then((data) => {
      if (data) {
        logger.info(`Area found with code: ${code}`);
        res.send(data);
      } else {
        logger.warn(`Area not found with code: ${code}`);
        res.status(404).send({
          message: `Cannot find Area with code=${code}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving area with code=${code}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Area with code=" + code,
      });
    });
};

// Update an Area by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating area with id: ${id}`);

  Area.update(req.body, {
    where: { area_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Area ${id} updated successfully`);
        res.send({
          message: "Area was updated successfully.",
        });
      } else {
        logger.warn(`Cannot update area with id=${id}. Area not found or req.body is empty`);
        res.send({
          message: `Cannot update Area with id=${id}. Maybe Area was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating area with id=${id}: ${err.message}`);
      res.status(500).send({
        message: "Error updating Area with id=" + id,
      });
    });
};

// Delete an Area with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  logger.debug(`Deleting area with id: ${id}`);

  Area.destroy({
    where: { area_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Area ${id} deleted successfully`);
        res.send({
          message: "Area was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete area with id=${id}. Area not found`);
        res.send({
          message: `Cannot delete Area with id=${id}. Maybe Area was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting area with id=${id}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete Area with id=" + id,
      });
    });
};

// Delete all Areas from the database
exports.deleteAll = (req, res) => {
  logger.warn('Attempting to delete all areas');

  Area.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      logger.info(`${nums} areas deleted successfully`);
      res.send({ message: `${nums} Areas were deleted successfully!` });
    })
    .catch((err) => {
      logger.error(`Error deleting all areas: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while removing all areas.",
      });
    });
};

export default exports;
