import {Router} from 'express';
import { organizationController } from '../controllers/organizationController.js';
import { authController } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';


const router = Router();

router.post('/login',authController.login);
router.get('/me',authMiddleware,authController.getMe);


router.post('/register-organization',organizationController.registerOrganization);


export default router;