import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Position = SequelizeInstance.define("Position", {
  position_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  area_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  position_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  is_manager: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
}, {
  tableName: 'Position',
  timestamps: false,
  underscored: true,
});

export default Position;
