import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

/**
 * TaskListItem model definition (B-15702)
 * Represents checklist items within a TaskList. Managers can add items to checklists.
 * AC1: table columns task_list_item_id, task_id, description.
 * AC2: association to TaskList (belongsTo) is defined in models/index.js.
 */
const TaskListItem = SequelizeInstance.define("taskListItem", {
  task_list_item_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  task_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  tableName: "task_list_item",
});

export default TaskListItem;
