import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
import Session from "./session.model.js";
import Tutorial from "./tutorial.model.js";
import Availability from "./availability.model.js"; 
import Position from "./position.model.js";
import PositionUser from "./position_user.model.js";
import Area from "./area.model.js"; 


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.session = Session;
db.tutorial = Tutorial;
db.availability = Availability;

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

// foreign key for tutorials
db.user.hasMany(db.tutorial, { 
  as: "tutorial",
  foreignKey: "user_id",
  onDelete: "CASCADE"
});
db.tutorial.belongsTo(db.user, { 
  as: "user",
  foreignKey: "user_id"
});

// foreign key for lessons
db.tutorial.hasMany(
  db.lesson,
  { as: "lesson" },
  { foreignKey: { allowNull: false }, onDelete: "CASCADE" }
);
db.lesson.belongsTo(
  db.tutorial,
  { as: "tutorial" },
  { foreignKey: { allowNull: false }, onDelete: "CASCADE" }
);

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
