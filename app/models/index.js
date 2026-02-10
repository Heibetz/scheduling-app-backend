import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
import Session from "./session.model.js";
import Tutorial from "./tutorial.model.js";
import Lesson from "./lesson.model.js";
import Task from "./task.model.js"; 


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.session = Session;
db.tutorial = Tutorial;
db.lesson = Lesson;
db.task = Task;

// foreign key for session
db.user.hasMany(db.session, { 
  as: "session",
  foreignKey: "userId",
  onDelete: "CASCADE"
});
db.session.belongsTo(db.user, { 
  as: "user",
  foreignKey: "userId"
});

// foreign key for tutorials
db.user.hasMany(db.tutorial, { 
  as: "tutorial",
  foreignKey: "userId",
  onDelete: "CASCADE"
});
db.tutorial.belongsTo(db.user, { 
  as: "user",
  foreignKey: "userId"
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

export default db;
