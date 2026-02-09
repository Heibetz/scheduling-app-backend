import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const PositionUser = SequelizeInstance.define("PositionUser", {
  position_user_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  position_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  joined_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  is_active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'PositionUser',
  timestamps: false,
  underscored: true,
});

export default PositionUser;
