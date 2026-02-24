import db from "../models/index.js";
import logger from "../config/logger.js";

const ShiftTask = db.shiftTask;
const Shift = db.shift;
const TaskList = db.taskList;
const Op = db.Sequelize.Op;
const exports = {};

/**
 * Create and save a new ShiftTask (B-15700) - assigns a checklist to a shift
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.create = (req, res) => {
    if (req.body.shift_id == null|| req.body.shift_id === "") {
        logger.warn("ShiftTask creation attempt with empty shift_id");
        res.status(400).send({
            message: "Shift ID cannot be empty!",
        });
        return;
    }
    if (req.body.task_id == null || req.body.task_id === "") {
        logger.warn("ShiftTask creation attempt with empty task_id");
        res.status(400).send({
            message: "Task ID cannot be empty!",
        });
        return;
    }

    const shiftTask = {
        shift_id: req.body.shift_id,
        task_id: req.body.task_id,
    };

    logger.debug('Creating ShiftTask for shift_id: ${shiftTask.shift_id}, task_id: ${shiftTask.task_id}');

    ShiftTask.create(shiftTask)
        .then((data) => {
            logger.info('ShiftTask created successfully: ${data.shift_task_id}');
            res.send(data);
        })
        .catch((err) => {
            if (err.name === 'SequelizeUniqueConstraintError') {
                logger.warn('Duplicate ShiftTask rejected: shift_id=${shiftTask.shift_id}, task_id=${shiftTask.task_id}');
                res.status(409).send({
                    message: "This checklist is already assigned to this shift.",
                });
                return;
        }
    
        logger.error('Error creating ShiftTask: ${err.message}');
        res.status(500).send({
            message: err.message || "Some error occured while creating the ShiftTask.",
        });
    }); 
};

/**
 * Retrieve all ShiftTasks (optionally by shift_id and/or task_id)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object 
 */
exports.findAll = (req, res) => {
    const shiftId = req.query.shift_id;
    const taskId = req.query.task_id;
    const condition = {};
    if (shiftId) condition.shift_id = { [Op.eq]: shiftId };
    if (taskId) condition.task_id = { [Op.eq]: taskId };
    
    logger.debug('Fetching ShiftTasks with condition: ${JSON.stringify(condition)}');

    ShiftTask.findAll({ where: Object.keys(condition).length > 0 ? condition: null })
        .then((data) => {
            logger.info('Retrieved ${data.length} ShiftTasks');
            res.send(data);
        })
        .catch((err) => {
            logger.error('Error retrieving ShiftTasks: ${err.message}');
            res.status(500).send({
                message: err.message || "Some error occured while retrieving the ShiftTasks.",
            });
        })
    };

/**
 * Find a single shiftTask by id (optionally include shift and taskList)
 * @param {Object} req - Express request object
 * @param {Object} res - Express repsonse object
 */
exports.findOne = (req, res) => {
    const id = req.params.id;

    logger.debug('Finding ShiftTask with id: ${id}');

    const includes = [];

    if (req.query.include) {
        const includeList = req.query.include.split(',');
        if(includeList.includes('shift')) {
            includes.push({model: Shift, as: 'shift', attributes: ['shift_id', 'shift_date', 'start_time', 'end_time']});
        }
        if(includeList.includes('taskList')){
            includes.push({model: TaskList, as: 'taskList', attributes: ['task_id', 'task_name', 'area_id']});
        }
    }

    ShiftTask.findByPk(id, {include: includes})
        .then((data) => {
            if(data) {
                logger.info('ShiftTask found: ${id}');
                res.send(data);
            }
            else {
                logger.warn('ShiftTask not found with id: ${id}');
                res.status(404).send({
                    message: 'Cannot find ShiftTask with id: ${id}.',
                });
            }
        })
        .catch((err) => {
            logger.error('Error retrieving ShiftTask ${id}: ${err.message}');
            res.status(500).send({
                message: " Error retrieving ShiftTask with id=" + id,
            });
        });
};

/**
 * Update a ShiftTask by the id in the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.update = (req, res) => {
    const id = req.params.id;
    logger.debug('Updating ShiftTask ${id} with data: ${JSON.stringify(req.body)}');

    ShiftTask.update(req.body, {where: {shift_task_id: id}})
    .then((num) => {
        const affected = Array.isArray(num) ? num[0] : num;
        if(affected === 1) {
            logger.info('ShiftTask ${id} updated successfully');
            res.send({ message: "ShiftTask was updated successfully."});
        }
        else {
            logger.warn('Failed to update ShiftTask ${id} - not found or empty body');
            res.send({ message: 'Cannot update ShiftTask with id=${id}. Maybe ShiftTask was not found or req.body is empty!'});
        }
    })
    .catch((err) => {
        if(err.name === "SequelizeUniqueConstraintError") {
            logger.warn('Update rejected: duplicate shift_id and task_id for ShiftTask ${id}');
            res.status(409).send({
                message: "This checklist is already assigned to this shift.",
            });
            return;
        }
        logger.error('Error updating ShiftTask ${id}: ${err.message}');
        res.status(500).send({
            message: "Error updating ShiftTask with id=" + id,
        });
    });
};

/**
 * Delete a ShiftTask with the specified id in the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object 
 */
exports.delete = (req, res) => {
    const id = req.params.id;
    logger.debug('Attempting to delete ShiftTask: ${id}');
    ShiftTask.destroy({where: {shift_task_id: id}})
    .then((num) => {
        if(num === 1) {
            logger.info('ShiftTask ${id} deleted successfully');
            res.send({message: 'ShiftTask was deleted successfully!'});
        }
        else {
            logger.warn('Cannot delete ShifTask ${id} - not found');
            res.send({message: 'Cannot delete ShiftTask with id=${id}. Maybe ShiftTask was not found!'});
        }
    })
    .catch((err) => {
        logger.error('Error deleting ShiftTask ${id}: ${err.message}');
        res.status(500).send({
            message: "Error deleting ShiftTask with id=" + id,
        });
    });
};
export default exports;