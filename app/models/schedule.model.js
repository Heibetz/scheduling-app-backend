import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Schedule = SequelizeInstance.define("schedule", {
  schedule_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  area_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'areas',
      key: 'area_id'
    }
  },
  start_date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  end_date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  schedule_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.STRING(20),
    allowNull: false,
    defaultValue: 'draft',
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Schedule;