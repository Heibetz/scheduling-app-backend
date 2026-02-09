import db from "../models/index.js";
import logger from "../config/logger.js";

const PositionUser = db.PositionUser;
const exports = {};

// Create and Save a new PositionUser
exports.create = (req, res) => {
  if (!req.body.position_id || !req.body.user_id) {
    logger.warn('PositionUser creation attempt with missing fields');
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }
  const positionUser = {
    position_id: req.body.position_id,
    user_id: req.body.user_id,
    joined_at: req.body.joined_at || new Date(),
    is_active: req.body.is_active !== undefined ? req.body.is_active : true,
  };
  logger.debug(`Creating position-user assignment: position ${positionUser.position_id}, user ${positionUser.user_id}`);
  PositionUser.create(positionUser)
    .then((data) => {
      logger.info(`PositionUser created successfully: ${data.position_user_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating position-user: ${err.message}`);
      res.status(500).send({ message: err.message || "Some error occurred while creating the PositionUser." });
    });
};

// Retrieve all PositionUsers
exports.findAll = (req, res) => {
  PositionUser.findAll()
    .then((data) => res.send(data))
    .catch((err) => {
      logger.error(`Error retrieving position-users: ${err.message}`);
      res.status(500).send({ message: err.message || "Some error occurred while retrieving position-users." });
    });
};

// Retrieve a single PositionUser with id
exports.findOne = (req, res) => {
  PositionUser.findByPk(req.params.id)
    .then((data) => {
      if (!data) {
        res.status(404).send({ message: "PositionUser not found." });
      } else {
        res.send(data);
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving position-user: ${err.message}`);
      res.status(500).send({ message: err.message || "Error retrieving position-user." });
    });
};

// Update a PositionUser with id
exports.update = (req, res) => {
  PositionUser.update(req.body, { where: { position_user_id: req.params.id } })
    .then(([num]) => {
      if (num === 1) {
        res.send({ message: "PositionUser was updated successfully." });
      } else {
        res.status(404).send({ message: `Cannot update PositionUser with id=${req.params.id}. Maybe PositionUser was not found!` });
      }
    })
    .catch((err) => {
      logger.error(`Error updating position-user: ${err.message}`);
      res.status(500).send({ message: err.message || "Error updating position-user." });
    });
};

// Delete a PositionUser with id
exports.delete = (req, res) => {
  PositionUser.destroy({ where: { position_user_id: req.params.id } })
    .then((num) => {
      if (num === 1) {
        res.send({ message: "PositionUser was deleted successfully!" });
      } else {
        res.status(404).send({ message: `Cannot delete PositionUser with id=${req.params.id}. Maybe PositionUser was not found!` });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting position-user: ${err.message}`);
      res.status(500).send({ message: err.message || "Could not delete PositionUser." });
    });
};

export default exports;
