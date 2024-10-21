import { Router } from "express";
import { AdminController } from "../Controllers/adminControllers";
import { AdminService } from "../Services/adminServices";
import verifyToken from "../Middleware/adminMiddleware";

const router = Router()
const adminService  = new AdminService
const adminController = new AdminController(adminService);

router.post('/verifyAdmin',adminController.verifyAdmin);
router.get('/getUsers',verifyToken,adminController.getUsers);
router.get('/getfreelancerapplications',verifyToken, adminController.getFreelancerApplication)
router.put('/updatefreelancerstatus/:applicationId',adminController.updateFreelancerStatus)
router.put('/blockfreelancer/:email',adminController.blockFreelancer)
router.put('/blockUser/:email',adminController.blockUser)
router.post('/adminlogout',adminController.adminLogout)
router.post('/category',adminController.createCategory)
router.get('/getcategories',adminController.getCategories)

export default router