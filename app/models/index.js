import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
import Session from "./session.model.js";
import Availability from "./availability.model.js"; 
import Position from "./position.model.js";
import PositionUser from "./position_user.model.js";
import Area from "./area.model.js"; 


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.session = Session;
db.availability = Availability;
db.position = Position;
db.positionUser = PositionUser;
db.area = Area;

// foreign key for session
db.user.hasMany(db.session, { 
  as: "session",
  foreignKey: "user_id",
  onDelete: "CASCADE"
});
db.session.belongsTo(db.user, { 
  as: "user",
  foreignKey: "user_id"
});

// foreign key for availability
db.user.hasMany(db.availability, { 
  as: "availability",
  foreignKey: "user_id",
  onDelete: "CASCADE"
});
db.availability.belongsTo(db.user, { 
  as: "user",
  foreignKey: "user_id"
});

export default db;
