import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const ShiftClaim = SequelizeInstance.define(
  "shift_claim",
  {
    shift_claim_id: {
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
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    tableName: "shift_claims",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["shift_id", "user_id"],
        name: "uk_shift_claims_shift_user",
      },
    ],
  }
);

export default ShiftClaim;
