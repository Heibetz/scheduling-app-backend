import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Area = SequelizeInstance.define("area", {
  area_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  area_code: {
    type: Sequelize.STRING(20),
    allowNull: false,
    unique: true,
  },
  area_name: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Area;
