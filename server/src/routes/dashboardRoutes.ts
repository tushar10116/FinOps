import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { dashboardController } from "../controllers/dashboardController.js";
import { authorizeRoles } from "../middlewares/permissionMiddleware.js";

const router = Router()

router.get("/get-dashboard",authMiddleware,dashboardController.getDashboard)
router.post("/resize-resource",authMiddleware,authorizeRoles("admin"),dashboardController.resizeResource)

export default router