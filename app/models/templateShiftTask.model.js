import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TemplateShiftTask = SequelizeInstance.define("templateShiftTask", {
  template_shift_task_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  template_shift_id: {
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
  tableName: "template_shift_task",
  indexes: [
    {
      unique: true,
      name: "tst_unique",
      fields: ["template_shift_id", "task_id"],
    },
  ],
});

export default TemplateShiftTask;
