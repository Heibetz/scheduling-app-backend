import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Shift = SequelizeInstance.define("shift", {
  shift_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  schedule_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  position_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  shift_date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  start_time: {
    type: Sequelize.TIME,
    allowNull: false,
  },
  end_time: {
    type: Sequelize.TIME,
    allowNull: false,
  },
  is_open: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  assignment_type: {
    type: Sequelize.STRING(20),
    allowNull: true,
  },
  status: {
    type: Sequelize.STRING(20),
    allowNull: true,
  },
  assigned_by: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  assigned_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  confirmed_at: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  created_by: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Shift;
