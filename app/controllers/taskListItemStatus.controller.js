import db from "../models/index.js";
import logger from "../config/logger.js";

const TaskListItemStatus = db.taskListItemStatus;
const Shift = db.shift;
const TaskListItem = db.taskListItem;
const Op = db.Sequelize.Op;
const exports = {};

/**
 * Create and Save a new TaskListItemStatus (AC3 - B-16201)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.create = (req, res) => {
  if (req.body.shift_id == null || req.body.shift_id === "") {
    logger.warn("TaskListItemStatus creation attempt with empty shift_id");
    res.status(400).send({ message: "Shift ID can not be empty!" });
    return;
  }
  if (req.body.task_list_item_id == null || req.body.task_list_item_id === "") {
    logger.warn("TaskListItemStatus creation attempt with empty task_list_item_id");
    res.status(400).send({ message: "Task list item ID can not be empty!" });
    return;
  }

  const payload = {
    shift_id: req.body.shift_id,
    task_list_item_id: req.body.task_list_item_id,
    is_completed: req.body.is_completed != null ? !!req.body.is_completed : false,
    completed_at: req.body.completed_at || null,
  };

  logger.debug(`Creating TaskListItemStatus for shift_id=${payload.shift_id}, task_list_item_id=${payload.task_list_item_id}`);

  TaskListItemStatus.create(payload)
    .then((data) => {
      logger.info(`TaskListItemStatus created: ${data.task_list_item_status_id}`);
      res.send(data);
    })
    .catch((err) => {
      if (err.name === "SequelizeUniqueConstraintError") {
        logger.warn("TaskListItemStatus unique constraint violated (shift_id, task_list_item_id)");
        res.status(409).send({
          message: "A status already exists for this shift and task list item (unique constraint).",
        });
        return;
      }
      logger.error(`Error creating TaskListItemStatus: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the TaskListItemStatus.",
      });
    });
};

/**
 * Retrieve all TaskListItemStatuses (optional ?shift_id= and ?task_list_item_id=)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findAll = (req, res) => {
  const shiftId = req.query.shift_id;
  const taskListItemId = req.query.task_list_item_id;
  const condition = {};
  if (shiftId) condition.shift_id = { [Op.eq]: shiftId };
  if (taskListItemId) condition.task_list_item_id = { [Op.eq]: taskListItemId };

  logger.debug(`Fetching TaskListItemStatuses with condition: ${JSON.stringify(condition)}`);

  TaskListItemStatus.findAll({
    where: Object.keys(condition).length ? condition : null,
  })
    .then((data) => {
      logger.info(`Retrieved ${data.length} TaskListItemStatuses`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving TaskListItemStatuses: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving TaskListItemStatuses.",
      });
    });
};

/**
 * Find a single TaskListItemStatus by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding TaskListItemStatus with id: ${id}`);

  TaskListItemStatus.findByPk(id, {
    include: [
      { model: Shift, as: "shift", attributes: ["shift_id", "shift_date", "start_time", "end_time"] },
      { model: TaskListItem, as: "taskListItem", attributes: ["task_list_item_id", "task_id", "description"] },
    ],
  })
    .then((data) => {
      if (data) {
        logger.info(`TaskListItemStatus found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`TaskListItemStatus not found with id: ${id}`);
        res.status(404).send({ message: `Cannot find TaskListItemStatus with id=${id}.` });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving TaskListItemStatus ${id}: ${err.message}`);
      res.status(500).send({ message: "Error retrieving TaskListItemStatus with id=" + id });
    });
};

/**
 * Update a TaskListItemStatus by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.update = (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating TaskListItemStatus ${id} with data: ${JSON.stringify(req.body)}`);

  TaskListItemStatus.update(req.body, { where: { task_list_item_status_id: id } })
    .then((num) => {
      const affected = Array.isArray(num) ? num[0] : num;
      if (affected === 1) {
        logger.info(`TaskListItemStatus ${id} updated successfully`);
        res.send({ message: "TaskListItemStatus was updated successfully." });
      } else {
        logger.warn(`Failed to update TaskListItemStatus ${id}`);
        res.send({
          message: `Cannot update TaskListItemStatus with id=${id}. Maybe not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      if (err.name === "SequelizeUniqueConstraintError") {
        logger.warn("TaskListItemStatus unique constraint violated on update");
        res.status(409).send({
          message: "A status already exists for this shift and task list item (unique constraint).",
        });
        return;
      }
      logger.error(`Error updating TaskListItemStatus ${id}: ${err.message}`);
      res.status(500).send({ message: "Error updating TaskListItemStatus with id=" + id });
    });
};

/**
 * Delete a TaskListItemStatus by id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.delete = (req, res) => {
  const id = req.params.id;

  logger.debug(`Attempting to delete TaskListItemStatus: ${id}`);

  TaskListItemStatus.destroy({ where: { task_list_item_status_id: id } })
    .then((num) => {
      if (num === 1) {
        logger.info(`TaskListItemStatus ${id} deleted successfully`);
        res.send({ message: "TaskListItemStatus was deleted successfully!" });
      } else {
        logger.warn(`Cannot delete TaskListItemStatus ${id} - not found`);
        res.send({
          message: `Cannot delete TaskListItemStatus with id=${id}. Maybe not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting TaskListItemStatus ${id}: ${err.message}`);
      res.status(500).send({ message: "Could not delete TaskListItemStatus with id=" + id });
    });
};

export default exports;
