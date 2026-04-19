import db from "../models/index.js";
import logger from "../config/logger.js";

const ScheduleTemplate = db.scheduleTemplate;
const TemplateShift = db.templateShift;
const TemplateShiftTask = db.templateShiftTask;
const Schedule = db.schedule;
const Shift = db.shift;
const ShiftTask = db.shiftTask;
const Position = db.position;
const Area = db.area;
const TaskList = db.taskList;
const User = db.user;
const Op = db.Sequelize.Op;
const exports = {};

// ── Template CRUD ──────────────────────────────────────────

exports.create = (req, res) => {
  if (!req.body.area_id || !req.body.template_name) {
    return res.status(400).send({ message: "area_id and template_name are required!" });
  }

  ScheduleTemplate.create({
    area_id: req.body.area_id,
    template_name: req.body.template_name,
  })
    .then((data) => {
      logger.info(`ScheduleTemplate created: ${data.template_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating ScheduleTemplate: ${err.message}`);
      res.status(500).send({ message: err.message || "Error creating template." });
    });
};

exports.findAll = (req, res) => {
  const areaId = req.query.area_id;
  const condition = areaId ? { area_id: { [Op.eq]: areaId } } : null;

  ScheduleTemplate.findAll({
    where: condition,
    include: [
      { model: Area, as: "area", attributes: ["area_id", "area_code", "area_name"] },
      {
        model: TemplateShift,
        as: "templateShifts",
        include: [
          { model: Position, as: "position", attributes: ["position_id", "position_name"] },
          { model: User, as: "user", attributes: ["user_id", "fName", "lName", "email"] },
          {
            model: TemplateShiftTask,
            as: "templateShiftTasks",
            include: [{ model: TaskList, as: "taskList", attributes: ["task_id", "task_name"] }],
          },
        ],
      },
    ],
  })
    .then((data) => res.send(data))
    .catch((err) => {
      logger.error(`Error fetching templates: ${err.message}`);
      res.status(500).send({ message: err.message || "Error fetching templates." });
    });
};

exports.findOne = (req, res) => {
  ScheduleTemplate.findByPk(req.params.id, {
    include: [
      { model: Area, as: "area", attributes: ["area_id", "area_code", "area_name"] },
      {
        model: TemplateShift,
        as: "templateShifts",
        include: [
          { model: Position, as: "position", attributes: ["position_id", "position_name"] },
          { model: User, as: "user", attributes: ["user_id", "fName", "lName", "email"] },
          {
            model: TemplateShiftTask,
            as: "templateShiftTasks",
            include: [{ model: TaskList, as: "taskList", attributes: ["task_id", "task_name"] }],
          },
        ],
      },
    ],
  })
    .then((data) => {
      if (!data) return res.status(404).send({ message: `Template id=${req.params.id} not found.` });
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error fetching template ${req.params.id}: ${err.message}`);
      res.status(500).send({ message: "Error fetching template." });
    });
};

exports.update = (req, res) => {
  ScheduleTemplate.update(req.body, { where: { template_id: req.params.id } })
    .then(([num]) => {
      if (num === 1) {
        res.send({ message: "Template updated." });
      } else {
        res.send({ message: `Cannot update template id=${req.params.id}.` });
      }
    })
    .catch((err) => {
      logger.error(`Error updating template ${req.params.id}: ${err.message}`);
      res.status(500).send({ message: "Error updating template." });
    });
};

exports.delete = async (req, res) => {
  try {
    const num = await ScheduleTemplate.destroy({ where: { template_id: req.params.id } });
    if (num === 1) {
      res.send({ message: "Template deleted." });
    } else {
      res.send({ message: `Cannot delete template id=${req.params.id}.` });
    }
  } catch (err) {
    logger.error(`Error deleting template ${req.params.id}: ${err.message}`);
    res.status(500).send({ message: "Error deleting template." });
  }
};

// ── TemplateShift CRUD ─────────────────────────────────────

exports.createShift = (req, res) => {
  const templateId = req.params.id;
  const { day_of_week, position_id, start_time, end_time, user_id } = req.body;

  if (day_of_week == null || !position_id || !start_time || !end_time) {
    return res.status(400).send({ message: "day_of_week, position_id, start_time, end_time are required!" });
  }
  if (day_of_week < 0 || day_of_week > 6) {
    return res.status(400).send({ message: "day_of_week must be 0 (Sun) – 6 (Sat)." });
  }

  TemplateShift.create({ template_id: templateId, day_of_week, position_id, start_time, end_time, user_id: user_id || null })
    .then((data) => {
      logger.info(`TemplateShift created: ${data.template_shift_id}`);
      res.send(data);
    })
    .catch((err) => {
      logger.error(`Error creating template shift: ${err.message}`);
      res.status(500).send({ message: err.message || "Error creating template shift." });
    });
};

exports.updateShift = (req, res) => {
  TemplateShift.update(req.body, { where: { template_shift_id: req.params.shiftId } })
    .then(([num]) => {
      if (num === 1) res.send({ message: "Template shift updated." });
      else res.send({ message: `Cannot update template shift id=${req.params.shiftId}.` });
    })
    .catch((err) => {
      logger.error(`Error updating template shift: ${err.message}`);
      res.status(500).send({ message: "Error updating template shift." });
    });
};

exports.deleteShift = async (req, res) => {
  try {
    const num = await TemplateShift.destroy({ where: { template_shift_id: req.params.shiftId } });
    if (num === 1) res.send({ message: "Template shift deleted." });
    else res.send({ message: `Cannot delete template shift id=${req.params.shiftId}.` });
  } catch (err) {
    logger.error(`Error deleting template shift: ${err.message}`);
    res.status(500).send({ message: "Error deleting template shift." });
  }
};

// ── TemplateShiftTask CRUD ─────────────────────────────────

exports.createShiftTask = (req, res) => {
  const { task_id } = req.body;
  if (!task_id) {
    return res.status(400).send({ message: "task_id is required!" });
  }

  TemplateShiftTask.create({ template_shift_id: req.params.shiftId, task_id })
    .then((data) => {
      logger.info(`TemplateShiftTask created: ${data.template_shift_task_id}`);
      res.send(data);
    })
    .catch((err) => {
      if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).send({ message: "Task already assigned to this template shift." });
      }
      logger.error(`Error creating template shift task: ${err.message}`);
      res.status(500).send({ message: err.message || "Error creating template shift task." });
    });
};

exports.deleteShiftTask = async (req, res) => {
  try {
    const num = await TemplateShiftTask.destroy({ where: { template_shift_task_id: req.params.taskId } });
    if (num === 1) res.send({ message: "Template shift task removed." });
    else res.send({ message: `Cannot delete template shift task id=${req.params.taskId}.` });
  } catch (err) {
    logger.error(`Error deleting template shift task: ${err.message}`);
    res.status(500).send({ message: "Error deleting template shift task." });
  }
};

// ── Apply Template → create a real Schedule (draft) ────────

exports.apply = async (req, res) => {
  const templateId = req.params.id;
  const { start_date, end_date, schedule_name, created_by } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).send({ message: "start_date and end_date are required!" });
  }
  if (new Date(start_date) >= new Date(end_date)) {
    return res.status(400).send({ message: "end_date must be after start_date!" });
  }
  if (!created_by) {
    return res.status(400).send({ message: "created_by (user_id) is required!" });
  }

  const t = await db.sequelize.transaction();
  try {
    // Load template with shifts + tasks
    const template = await ScheduleTemplate.findByPk(templateId, {
      include: [{
        model: TemplateShift,
        as: "templateShifts",
        include: [{ model: TemplateShiftTask, as: "templateShiftTasks" }],
      }],
      transaction: t,
    });

    if (!template) {
      await t.rollback();
      return res.status(404).send({ message: `Template id=${templateId} not found.` });
    }

    // Create the schedule in draft status
    const schedule = await Schedule.create({
      area_id: template.area_id,
      start_date,
      end_date,
      schedule_name: schedule_name || `${template.template_name}`,
      status: "draft",
    }, { transaction: t });

    const scheduleId = schedule.schedule_id;

    // Generate each date in the range
    const sDate = new Date(start_date + "T00:00:00");
    const eDate = new Date(end_date + "T00:00:00");
    const dates = [];
    for (let d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    let shiftsCreated = 0;
    let tasksCreated = 0;

    logger.info(`Apply: template has ${template.templateShifts.length} shifts, date range has ${dates.length} days`);

    for (const ts of template.templateShifts) {
      // Find all dates matching this day_of_week
      const matchingDates = dates.filter((d) => d.getDay() === ts.day_of_week);
      logger.info(`Apply: template shift day_of_week=${ts.day_of_week}, matched ${matchingDates.length} dates`);

      for (const date of matchingDates) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const shift = await Shift.create({
          schedule_id: scheduleId,
          position_id: ts.position_id,
          user_id: ts.user_id || null,
          shift_date: dateStr,
          start_time: ts.start_time,
          end_time: ts.end_time,
          is_open: !ts.user_id,
          created_by,
        }, { transaction: t });

        shiftsCreated++;

        // Copy task assignments
        for (const tst of ts.templateShiftTasks) {
          await ShiftTask.create({
            shift_id: shift.shift_id,
            task_id: tst.task_id,
          }, { transaction: t });
          tasksCreated++;
        }
      }
    }

    await t.commit();

    logger.info(`Template ${templateId} applied → schedule ${scheduleId} (${shiftsCreated} shifts, ${tasksCreated} task assignments)`);
    res.send({
      message: "Template applied successfully.",
      schedule_id: scheduleId,
      shifts_created: shiftsCreated,
      tasks_created: tasksCreated,
    });
  } catch (err) {
    await t.rollback();
    logger.error(`Error applying template ${templateId}: ${err.message}`);
    res.status(500).send({ message: err.message || "Error applying template." });
  }
};

export default exports;
