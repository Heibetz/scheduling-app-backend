import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
import Session from "./session.model.js";
import Tutorial from "./tutorial.model.js";
import Lesson from "./lesson.model.js";
import Area from "./area.model.js";
import TaskList from "./taskList.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.session = Session;
db.tutorial = Tutorial;
db.lesson = Lesson;
db.area = Area;
db.taskList = TaskList;

// TaskList belongs to Area (area_id)
db.area.hasMany(db.taskList, { as: "taskLists", foreignKey: "area_id", onDelete: "CASCADE" });
db.taskList.belongsTo(db.area, { as: "area", foreignKey: "area_id" });

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
