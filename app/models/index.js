import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
import Session from "./session.model.js";
// import Tutorial from "./tutorial.model.js";
// import Lesson from "./lesson.model.js";
import Shift from "./shift.model.js"; 
import Availability from "./availability.model.js"; 
import Position from "./position.model.js";
import PositionUser from "./position_user.model.js";
import Area from "./area.model.js"; 
import TaskList from "./taskList.model.js";
import TaskListItem from "./taskListItem.model.js";
import TaskListItemStatus from "./taskListItemStatus.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.session = Session;
db.availability = Availability;
db.shift = Shift;
db.position = Position;
db.positionUser = PositionUser;
db.area = Area;
db.taskList = TaskList;
db.taskListItem = TaskListItem;
db.taskListItemStatus = TaskListItemStatus;

// TaskList belongs to Area (area_id)
db.area.hasMany(db.taskList, { as: "taskLists", foreignKey: "area_id", onDelete: "CASCADE" });
db.taskList.belongsTo(db.area, { as: "area", foreignKey: "area_id" });

// TaskListItem belongs to TaskList (AC2 - B-15702)
db.taskList.hasMany(db.taskListItem, { as: "taskListItems", foreignKey: "task_id", onDelete: "CASCADE" });
db.taskListItem.belongsTo(db.taskList, { as: "taskList", foreignKey: "task_id" });

// TaskListItemStatus belongs to Shift and TaskListItem (B-16201)
db.shift.hasMany(db.taskListItemStatus, { as: "taskListItemStatuses", foreignKey: "shift_id", onDelete: "CASCADE" });
db.taskListItemStatus.belongsTo(db.shift, { as: "shift", foreignKey: "shift_id" });
db.taskListItem.hasMany(db.taskListItemStatus, { as: "taskListItemStatuses", foreignKey: "task_list_item_id", onDelete: "CASCADE" });
db.taskListItemStatus.belongsTo(db.taskListItem, { as: "taskListItem", foreignKey: "task_list_item_id" });

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
