import { Router } from "express";


import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import AvailabilityRoutes from "./availability.routes.js";
import ShiftRoutes from "./shift.routes.js";
import PositionRoutes from "./position.routes.js";
import PositionUserRoutes from "./position_user.routes.js";
import AreaRoutes from "./area.routes.js";
import NotificationRoutes from "./notification.routes.js";
import TaskListRoutes from "./taskList.routes.js";
import TaskListItemRoutes from "./taskListItem.routes.js";
import TaskListItemStatusRoutes from "./taskListItemStatus.routes.js";
import ShiftTaskRoutes from "./shiftTask.routes.js";

const router = Router();


router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/availabilities", AvailabilityRoutes);
router.use("/shifts", ShiftRoutes);
// router.use("/tutorials", TutorialRoutes);
// router.use("/tutorials", LessonRoutes);
router.use("/positions", PositionRoutes);
router.use("/position-users", PositionUserRoutes);
router.use("/areas", AreaRoutes);
router.use("/notifications", NotificationRoutes);
router.use("/tasklists", TaskListRoutes);
router.use("/task-list-items", TaskListItemRoutes);
router.use("/task-list-item-statuses", TaskListItemStatusRoutes);
router.use("/shift-tasks", ShiftTaskRoutes);

export default router;
