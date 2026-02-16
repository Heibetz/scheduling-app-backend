import db from "../models/index.js";
import logger from "../config/logger.js";

const Position = db.position;
const exports = {};

// Create and Save a new Position
exports.create = (req, res) => {
  if (!req.body.position_name) {
    logger.warn('Position creation attempt with empty position_name');
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }
  const position = {
    area_id: req.body.area_id,
    position_name: req.body.position_name,
    is_manager: req.body.is_manager || false,
  };
  logger.debug(`Creating position: ${position.position_name}`);
  Position.create(position)
    .then((data) => {
      logger.info(`Position created successfully: ${data.position_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating position: ${err.message}`);
      res.status(500).send({ message: err.message || "Some error occurred while creating the Position." });
    });
};

// Retrieve all Positions
exports.findAll = (req, res) => {
  Position.findAll()
    .then((data) => res.send(data))
    .catch((err) => {
      logger.error(`Error retrieving positions: ${err.message}`);
      res.status(500).send({ message: err.message || "Some error occurred while retrieving positions." });
    });
};

// Retrieve a single Position with id
exports.findOne = (req, res) => {
  Position.findByPk(req.params.id)
    .then((data) => {
      if (!data) {
        res.status(404).send({ message: "Position not found." });
      } else {
        res.send(data);
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving position: ${err.message}`);
      res.status(500).send({ message: err.message || "Error retrieving position." });
    });
};

// Update a Position with id
exports.update = (req, res) => {
  Position.update(req.body, { where: { position_id: req.params.id } })
    .then(([num]) => {
      if (num === 1) {
        res.send({ message: "Position was updated successfully." });
      } else {
        res.status(404).send({ message: `Cannot update Position with id=${req.params.id}. Maybe Position was not found!` });
      }
    })
    .catch((err) => {
      logger.error(`Error updating position: ${err.message}`);
      res.status(500).send({ message: err.message || "Error updating position." });
    });
};

// Delete a Position with id
exports.delete = (req, res) => {
  Position.destroy({ where: { position_id: req.params.id } })
    .then((num) => {
      if (num === 1) {
        res.send({ message: "Position was deleted successfully!" });
      } else {
        res.status(404).send({ message: `Cannot delete Position with id=${req.params.id}. Maybe Position was not found!` });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting position: ${err.message}`);
      res.status(500).send({ message: err.message || "Could not delete Position." });
    });
};

export default exports;
