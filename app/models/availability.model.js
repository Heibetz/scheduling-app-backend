import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Availability = SequelizeInstance.define("availability", {
  availability_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  day_of_week: {
    type: Sequelize.INTEGER,
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
  is_active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Availability;
