import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const TemplateShift = SequelizeInstance.define("templateShift", {
  template_shift_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  template_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  day_of_week: {
    type: Sequelize.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 20 },
  },
  position_id: {
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
  user_id: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
}, {
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  tableName: "template_shift",
});

export default TemplateShift;
