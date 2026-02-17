import db from "../models/index.js";
import logger from "../config/logger.js";

const TaskList = db.taskList;
const Area = db.area;
const Op = db.Sequelize.Op;
const TaskListItem = db.taskListItem;
const exports = {};

/**
 * Create and Save a new TaskList
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.create = (req, res) => {
  if (!req.body.task_name) {
    logger.warn('TaskList creation attempt with empty task_name');
    res.status(400).send({
      message: "Task name can not be empty!",
    });
    return;
  }

  if (!req.body.area_id) {
    logger.warn('TaskList creation attempt with empty area_id');
    res.status(400).send({
      message: "Area ID can not be empty!",
    });
    return;
  }

  const taskList = {
    area_id: req.body.area_id,
    task_name: req.body.task_name,
    description: req.body.description || null,
  };

  logger.debug(`Creating taskList: ${taskList.task_name} for area: ${taskList.area_id}`);

  TaskList.create(taskList)
    .then((data) => {
      logger.info(`TaskList created successfully: ${data.task_id} - ${data.task_name}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating taskList: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while creating the TaskList.",
      });
    });
};

/**
 * Retrieve all TaskLists (optionally by area_id)
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

  logger.debug(`Fetching all taskLists with condition: ${JSON.stringify(condition)}`);

  TaskList.findAll({ where: Object.keys(condition).length > 0 ? condition : null })
    .then((data) => {
      logger.info(`Retrieved ${data.length} taskLists`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error retrieving taskLists: ${err.message}`);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving taskLists.",
      });
    });
};

/**
 * Find a single TaskList by id (getById)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findOne = (req, res) => {
  const id = req.params.id;

  logger.debug(`Finding taskList with id: ${id}`);

  // Build includes array based on query parameter
  const includes = [];
  
  if (req.query.include) {
    const includeList = req.query.include.split(',');
    
    if (includeList.includes('area')) {
      includes.push({ model: Area, as: "area", attributes: ["area_id", "area_code", "area_name"] });
    }
    
    if (includeList.includes('taskListItems')) {
      includes.push({ model: TaskListItem, as: "taskListItems" });
    }
  } else {
    // Default: include area if no include parameter specified
    includes.push({ model: Area, as: "area", attributes: ["area_id", "area_code", "area_name"] });
  }

  TaskList.findByPk(id, {
    include: includes,
  })
    .then((data) => {
      if (data) {
        logger.info(`TaskList found: ${id}`);
        res.send(data);
      } else {
        logger.warn(`TaskList not found with id: ${id}`);
        res.status(404).send({
          message: `Cannot find TaskList with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error retrieving taskList ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error retrieving TaskList with id=" + id,
      });
    });
};

/**
 * Update a TaskList by the id in the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.update = (req, res) => {
  const id = req.params.id;

  logger.debug(`Updating taskList ${id} with data: ${JSON.stringify(req.body)}`);

  TaskList.update(req.body, {
    where: { task_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`TaskList ${id} updated successfully`);
        res.send({
          message: "TaskList was updated successfully.",
        });
      } else {
        logger.warn(`Failed to update taskList ${id} - not found or empty body`);
        res.send({
          message: `Cannot update TaskList with id=${id}. Maybe TaskList was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error updating taskList ${id}: ${err.message}`);
      res.status(500).send({
        message: "Error updating TaskList with id=" + id,
      });
    });
};

/**
 * Delete a TaskList with the specified id in the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.delete = (req, res) => {
  const id = req.params.id;

  logger.debug(`Attempting to delete taskList: ${id}`);

  TaskList.destroy({
    where: { task_id: id },
  })
    .then((num) => {
      if (num == 1) {
        logger.info(`TaskList ${id} deleted successfully`);
        res.send({
          message: "TaskList was deleted successfully!",
        });
      } else {
        logger.warn(`Cannot delete taskList ${id} - not found`);
        res.send({
          message: `Cannot delete TaskList with id=${id}. Maybe TaskList was not found!`,
        });
      }
    })
    .catch((err) => {
      logger.error(`Error deleting taskList ${id}: ${err.message}`);
      res.status(500).send({
        message: "Could not delete TaskList with id=" + id,
      });
    });
};

export default exports;
