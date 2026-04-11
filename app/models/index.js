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
import Schedule from "./schedule.model.js"; 
import Notification from "./notification.model.js";
import TaskList from "./taskList.model.js";
import TaskListItem from "./taskListItem.model.js";
import TaskListItemStatus from "./taskListItemStatus.model.js";
import ShiftTask from "./shiftTask.model.js";
import ShiftClaim from "./shift_claim.model.js";
import ShiftActivity from "./shift_activity.model.js";
import TradeRequest from "./trade_request.model.js";

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
db.schedule = Schedule;
db.notification = Notification;
db.taskList = TaskList;
db.taskListItem = TaskListItem;
db.taskListItemStatus = TaskListItemStatus;
db.shiftTask = ShiftTask;
db.shiftClaim = ShiftClaim;
db.shiftActivity = ShiftActivity;
db.tradeRequest = TradeRequest;
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

// ShiftTask belongs to Shift and TaskList (B-15700)
db.shift.hasMany(db.shiftTask, { as: "shiftTasks", foreignKey: "shift_id", onDelete: "CASCADE" });
db.shiftTask.belongsTo(db.shift, { as: "shift", foreignKey: "shift_id" });
db.taskList.hasMany(db.shiftTask, { as: "shiftTasks", foreignKey: "task_id", onDelete: "CASCADE" });
db.shiftTask.belongsTo(db.taskList, { as: "taskList", foreignKey: "task_id" });

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

// foreign key for schedule - belongs to area
db.area.hasMany(db.schedule, {
  as: "schedules",
  foreignKey: "area_id",
  onDelete: "CASCADE"
});
db.schedule.belongsTo(db.area, {
  as: "area",
  foreignKey: "area_id"
});

// shift belongs to schedule
db.schedule.hasMany(db.shift, {
  as: "shifts",
  foreignKey: "schedule_id",
  onDelete: "CASCADE"
});
db.shift.belongsTo(db.schedule, {
  as: "schedule",
  foreignKey: "schedule_id"
});

db.position.hasMany(db.shift, {
  as: "shiftsForPosition",
  foreignKey: "position_id",
  onDelete: "RESTRICT",
});
db.shift.belongsTo(db.position, {
  as: "position",
  foreignKey: "position_id"
});

// position belongs to area
db.area.hasMany(db.position, {
  as: "positions",
  foreignKey: "area_id",
  onDelete: "CASCADE"
});
db.position.belongsTo(db.area, {
  as: "area",
  foreignKey: "area_id"
});

// positionUser belongs to position and user
db.position.hasMany(db.positionUser, {
  as: "positionUsers",
  foreignKey: "position_id",
  onDelete: "CASCADE"
});
db.positionUser.belongsTo(db.position, {
  as: "position",
  foreignKey: "position_id"
});
db.user.hasMany(db.positionUser, {
  as: "positionUsers",
  foreignKey: "user_id",
  onDelete: "CASCADE"
});
db.positionUser.belongsTo(db.user, {
  as: "user",
  foreignKey: "user_id"
});

// notification belongs to user and shift
db.user.hasMany(db.notification, {
  as: "notifications",
  foreignKey: "user_id",
  onDelete: "CASCADE"
});
db.notification.belongsTo(db.user, {
  as: "user",
  foreignKey: "user_id"
});
db.shift.hasMany(db.notification, {
  as: "notifications",
  foreignKey: "related_shift_id",
  onDelete: "SET NULL"
});
db.notification.belongsTo(db.shift, {
  as: "shift",
  foreignKey: "related_shift_id"
});

// shift_claim: user requests to pick up an open shift
db.user.hasMany(db.shiftClaim, {
  as: "shiftClaims",
  foreignKey: "user_id",
  onDelete: "CASCADE",
});
db.shiftClaim.belongsTo(db.user, {
  as: "user",
  foreignKey: "user_id",
});
db.shift.hasMany(db.shiftClaim, {
  as: "shiftClaims",
  foreignKey: "shift_id",
  onDelete: "CASCADE",
});
db.shiftClaim.belongsTo(db.shift, {
  as: "shift",
  foreignKey: "shift_id",
});

// trade_request: private trade offers between workers
db.user.hasMany(db.tradeRequest, {
  as: "tradeRequestsSent",
  foreignKey: "from_user_id",
  onDelete: "CASCADE",
});
db.user.hasMany(db.tradeRequest, {
  as: "tradeRequestsReceived",
  foreignKey: "to_user_id",
  onDelete: "CASCADE",
});
db.tradeRequest.belongsTo(db.user, {
  as: "fromUser",
  foreignKey: "from_user_id",
});
db.tradeRequest.belongsTo(db.user, {
  as: "toUser",
  foreignKey: "to_user_id",
});
db.shift.hasMany(db.tradeRequest, {
  as: "tradeRequests",
  foreignKey: "offered_shift_id",
  onDelete: "CASCADE",
});
db.tradeRequest.belongsTo(db.shift, {
  as: "offeredShift",
  foreignKey: "offered_shift_id",
});

export default db;
