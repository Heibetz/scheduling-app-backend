import db from "../models/index.js";
import logger from "../config/logger.js";

const TaskListItem = db.taskListItem;
const TaskList = db.taskList;
const Op = db.Sequelize.Op;
const exports = {};

/**
 * Create and Save a new TaskListItem (AC3 - B-15702)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.create = (req, res) => {
  if (req.body.task_id == null || req.body.task_id === "") {
    logger.warn("TaskListItem creation attempt with empty task_id");
    res.status(400).send({
      message: "Task ID can not be empty!",
    });
    return;
  }

  const taskListItem = {
    task_id: req.body.task_id,
    description: req.body.description || null,
  };

  logger.debug(`Creating TaskListItem for task_id: ${taskListItem.task_id}`);

  TaskListItem.create(taskListItem)
    .then((data) => {
      logger.info(`TaskListItem created successfully: ${data.task_list_item_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating TaskListItem: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the TaskListItem.",
      });
    });
};

/**
 * Retrieve all TaskListItems (optionally by task_id)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findAll = (req, res) => {
  const taskId = req.query.task_id;
  const condition = taskId ? { task_id: { [Op.eq]: taskId } } : null;

  logger.debug(`Fetching TaskListItems with condition: ${JSON.stringify(condition)}`);

  TaskListItem.findAll({ where: condition })
    .then((data) => {
      logger.info(`Retrieved ${data.length} TaskListItems`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving TaskListItems: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving TaskListItems.",
      });
    });
};

/**
 * Find a single TaskListItem by id (includes TaskList for belongsTo - AT-22419)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding TaskListItem with id: ${id}`);

  TaskListItem.findByPk(id, {
    include: [{ model: TaskList, as: "taskList", attributes: ["task_id", "task_name", "area_id"] }],
  })
    .then((data) => {
      if (data) {
        logger.info(`TaskListItem found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`TaskListItem not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find TaskListItem with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving TaskListItem ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving TaskListItem with id=" + id,
      });
    });
};

/**
 * Update a TaskListItem by the id in the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.update = (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating TaskListItem ${id} with data: ${JSON.stringify(req.body)}`);

  TaskListItem.update(req.body, {
    where: { task_list_item_id: id },
  })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;
      if (affected === 1) {
        logger.info(`TaskListItem ${id} updated successfully`);
        res.send({
          message: "TaskListItem was updated successfully.",
        });
      } else {
        logger.warn(`Failed to update TaskListItem ${id} - not found or empty body`);
        res.send({
          message: `Cannot update TaskListItem with id=${id}. Maybe TaskListItem was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating TaskListItem ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error updating TaskListItem with id=" + id,
      });
    });
};

/**
 * Delete a TaskListItem with the specified id in the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.delete = (req, res) => {
  const id = req.params.id;

  logger.debug(`Attempting to delete TaskListItem: ${id}`);

  TaskListItem.destroy({
    where: { task_list_item_id: id },
  })
    .then((num) => {
      if (num === 1) {
        logger.info(`TaskListItem ${id} deleted successfully`);
        res.send({
          message: "TaskListItem was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete TaskListItem ${id} - not found`);
        res.send({
          message: `Cannot delete TaskListItem with id=${id}. Maybe TaskListItem was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting TaskListItem ${id}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete TaskListItem with id=" + id,
      });
    });
};

export default exports;
