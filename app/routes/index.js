import { Router } from "express";


import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import TutorialRoutes from "./tutorial.routes.js";
import LessonRoutes from "./lesson.routes.js";
import AvailabilityRoutes from "./availability.routes.js";
import PositionRoutes from "./position.routes.js";
import PositionUserRoutes from "./position_user.routes.js";
import AreaRoutes from "./area.routes.js";


const router = Router();


router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/availabilities", AvailabilityRoutes);
router.use("/positions", PositionRoutes);
router.use("/position-users", PositionUserRoutes);
router.use("/areas", AreaRoutes);

export default router;
