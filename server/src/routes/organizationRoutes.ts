import {Router} from 'express';
import { organizationController } from '../controllers/organizationController.js';

import authMiddleware from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/permissionMiddleware.js';


const router = Router();

router.post('/invite-member',authMiddleware,authorizeRoles("admin"),organizationController.inviteMember);
router.get('/invited-members',authMiddleware,authorizeRoles("admin"),organizationController.getInvitedMembers);
router.delete('/remove-invited-member',authMiddleware,authorizeRoles("admin"),organizationController.removeInvitedMember);
router.post('/register-cloud',authMiddleware,authorizeRoles("admin"),organizationController.registerCloud);
router.get('/get-organization',authMiddleware,authorizeRoles("admin"),organizationController.getOrganizationById);
router.patch('/update-connection-status',authMiddleware,authorizeRoles("admin"),organizationController.updateCloudPlatformStatus)
router.delete('/remove-registered-member', authMiddleware, authorizeRoles("admin"), organizationController.deleteUser);
router.get('/get-organization-users',authMiddleware,authorizeRoles("admin"),organizationController.getUsers);
export default router;