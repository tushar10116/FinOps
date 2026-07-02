import {Router} from 'express';
import { organizationController } from '../controllers/organizationController.js';

import authMiddleware from '../middlewares/authMiddleware.js';


const router = Router();

router.post('/invite-member',authMiddleware,organizationController.inviteMember);
router.get('/invited-members',authMiddleware,organizationController.getInvitedMembers);
router.delete('/remove-invited-member',authMiddleware,organizationController.removeInvitedMember);
router.post('/generate-invite-token',authMiddleware,organizationController.getInvitedToken);
router.post('/register-cloud',authMiddleware,organizationController.registerCloud);
router.get('/get-organization',authMiddleware,organizationController.getOrganizationById);
router.patch('/update-connection-status',authMiddleware,organizationController.updateCloudPlatformStatus)
export default router;