import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Notification = SequelizeInstance.define("notification", {
  notification_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  type: {
    type: Sequelize.STRING(50),
    allowNull: false,
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  related_shift_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  is_read: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default Notification;
