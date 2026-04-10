import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ShiftActivity = SequelizeInstance.define(
  "shift_activity",
  {
    shift_activity_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    shift_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    action: {
      type: Sequelize.STRING(30),
      allowNull: false,
    },
    note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "shift_activity",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default ShiftActivity;

