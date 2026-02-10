import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
import Session from "./session.model.js";
import Tutorial from "./tutorial.model.js";
import Lesson from "./lesson.model.js";
import Availability from "./availability.model.js";
import Shift from "./shift.model.js"; 


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.session = Session;
db.tutorial = Tutorial;
db.lesson = Lesson;
db.availability = Availability;
db.shift = Shift;

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

// foreign key for shift - assigned user
db.user.hasMany(db.shift, { 
  as: "shifts",
  foreignKey: "user_id",
  onDelete: "SET NULL"
});
db.shift.belongsTo(db.user, { 
  as: "user",
  foreignKey: "user_id"
});

// foreign key for shift - assigned by user
db.user.hasMany(db.shift, { 
  as: "shiftsAssignedBy",
  foreignKey: "assigned_by",
  onDelete: "SET NULL"
});
db.shift.belongsTo(db.user, { 
  as: "assignedByUser",
  foreignKey: "assigned_by"
});

// foreign key for shift - created by user
db.user.hasMany(db.shift, { 
  as: "shiftsCreatedBy",
  foreignKey: "created_by",
  onDelete: "CASCADE"
});
db.shift.belongsTo(db.user, { 
  as: "createdByUser",
  foreignKey: "created_by"
});

export default db;
