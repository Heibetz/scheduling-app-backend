import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

/**
 * Task model definition
 * Represents tasks that can be assigned to shifts
 */
const Task = SequelizeInstance.define("task", {
  task_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  area_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    // Foreign key relationship to Area will be defined in models/index.js
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
  tableName: 'task',
});

export default Task;
