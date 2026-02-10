import db from "../models/index.js";
import logger from "../config/logger.js";

const Task = db.task;
const Op = db.Sequelize.Op;
const exports = {};

/**
 * Create and Save a new Task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.create = (req, res) => {
  // Validate request
  if (!req.body.task_name) {
    logger.warn('Task creation attempt with empty task_name');
    res.status(400).send({
      message: "Task name can not be empty!",
    });
    return;
  }

  if (!req.body.area_id) {
    logger.warn('Task creation attempt with empty area_id');
    res.status(400).send({
      message: "Area ID can not be empty!",
    });
    return;
  }

  // Create a Task
  const task = {
    area_id: req.body.area_id,
    task_name: req.body.task_name,
    description: req.body.description || null,
  };

  logger.debug(`Creating task: ${task.task_name} for area: ${task.area_id}`);

  // Save Task in the database
  Task.create(task)
    .then((data) => {
      logger.info(`Task created successfully: ${data.task_id} - ${data.task_name}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating task: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Task.",
      });
    });
};

/**
 * Retrieve all Tasks from the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findAll = (req, res) => {
  const areaId = req.query.area_id;
  const taskName = req.query.task_name;
  
  var condition = {};
  
  if (areaId) {
    condition.area_id = { [Op.eq]: areaId };
  }
  
  if (taskName) {
    condition.task_name = { [Op.like]: `%${taskName}%` };
  }

  logger.debug(`Fetching all tasks with condition: ${JSON.stringify(condition)}`);

  Task.findAll({ where: Object.keys(condition).length > 0 ? condition : null })
    .then((data) => {
      logger.info(`Retrieved ${data.length} tasks`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving tasks: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving tasks.",
      });
    });
};

/**
 * Find a single Task with an id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding task with id: ${id}`);

  Task.findByPk(id)
    .then((data) => {
      if (data) {
        logger.info(`Task found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`Task not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find Task with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving task ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving Task with id=" + id,
      });
    });
};

/**
 * Update a Task by the id in the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.update = (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating task ${id} with data: ${JSON.stringify(req.body)}`);

  Task.update(req.body, {
    where: { task_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Task ${id} updated successfully`);
        res.send({
          message: "Task was updated successfully.",
        });
      } else {
        logger.warn(`Failed to update task ${id} - not found or empty body`);
        res.send({
          message: `Cannot update Task with id=${id}. Maybe Task was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating task ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error updating Task with id=" + id,
      });
    });
};

/**
 * Delete a Task with the specified id in the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.delete = (req, res) => {
  const id = req.params.id;

  logger.debug(`Attempting to delete task: ${id}`);

  Task.destroy({
    where: { task_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`Task ${id} deleted successfully`);
        res.send({
          message: "Task was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete task ${id} - not found`);
        res.send({
          message: `Cannot delete Task with id=${id}. Maybe Task was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting task ${id}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete Task with id=" + id,
      });
    });
};

export default exports;
