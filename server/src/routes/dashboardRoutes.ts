import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { dashboardController } from "../controllers/dashboardController.js";

const router = Router()

router.get("/get-dashboard",authMiddleware,dashboardController.getDashboard)
router.post("/resize-resource",authMiddleware,dashboardController.resizeResource)

export default router