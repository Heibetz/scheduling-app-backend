// app/models/shiftTask.model.js
import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

/**
 * ShiftTask model (B-15700)
 * Assigns checklists (Tasklists) to shifts. 
 * AC1: shift_task_id, shift_id, task_id.
 * AC2: Unique constraint on (shift_id, task_id) to prevent duplicates. 
 */
const ShiftTask = SequelizeInstance.define("shiftTask", {
  shift_task_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shift_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  task_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  tableName: "shift_task",
  indexes: [
    {
      unique: true,
      name: "shift_task_unique",
      fields: ["shift_id", "task_id"],
    },
  ],
});

export default ShiftTask;