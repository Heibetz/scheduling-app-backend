import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

/**
 * TaskList model definition
 * Represents task lists (duties) that can be assigned to shifts
 * Associations: belongsTo Area, hasMany TaskListItem, belongsToMany Shift (when those models exist)
 */
const TaskList = SequelizeInstance.define("taskList", {
  task_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  area_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  task_name: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'TaskList',
});

export default TaskList;
