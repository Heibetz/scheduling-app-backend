import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

/**
 * TaskListItemStatus model definition (B-16201)
 * Tracks task completion per shift so workers can mark checklist items done.
 * AC1: task_list_item_status_id, shift_id, task_list_item_id, is_completed, completed_at.
 * AC2: Unique constraint on (shift_id, task_list_item_id).
 */
const TaskListItemStatus = SequelizeInstance.define("taskListItemStatus", {
  task_list_item_status_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shift_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  task_list_item_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  is_completed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  completed_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  tableName: "task_list_item_status",
  indexes: [
    {
      unique: true,
      name: "shift_task_list_item_unique",
      fields: ["shift_id", "task_list_item_id"],
    },
  ],
});

export default TaskListItemStatus;
