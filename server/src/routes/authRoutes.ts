import {Router} from 'express';
import { organizationController } from '../controllers/organizationController.js';
import { authController } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';


const router = Router();

router.post('/login',authController.login);
router.get('/me',authMiddleware,authController.getMe);
router.post("/register",authController.register);

router.post('/register-organization',organizationController.registerOrganization);
router.post('/get-reset-token',authController.getPasswordResetToken);
router.post('/reset-password',authController.resetPassword);


export default router;