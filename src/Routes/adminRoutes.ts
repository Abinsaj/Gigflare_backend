import { Router } from "express";
import { AdminController } from "../Controllers/adminControllers";
import { AdminService } from "../Services/adminServices";

const router = Router()
const adminService  = new AdminService
const adminController = new AdminController(adminService);

router.post('/verifyAdmin',adminController.verifyAdmin);
router.get('/getUsers', adminController.getUsers);
router.get('/getfreelancerapplications', adminController.getFreelancerApplication)
router.put('/updatefreelancerstatus/:applicationId',adminController.updateFreelancerStatus)
router.put('/blockfreelancer/:email',adminController.blockFreelancer)
router.put('/blockUser/:email',adminController.blockUser)

export default router