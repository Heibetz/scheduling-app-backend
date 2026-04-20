import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ScheduleTemplate = SequelizeInstance.define("scheduleTemplate", {
  template_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  area_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  template_name: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  duration_weeks: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  tableName: "schedule_template",
});

export default ScheduleTemplate;
