import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

/**
 * Private shift trade proposal from one worker to another.
 * @typedef {Object} TradeRequestAttrs
 */
const TradeRequest = SequelizeInstance.define(
  "trade_request",
  {
    trade_request_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    from_user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    to_user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    offered_shift_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "trade_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default TradeRequest;
