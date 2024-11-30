import { Router } from "express";
import { AdminController } from "../Controllers/adminControllers";
import { AdminService } from "../Services/adminServices";
import { verifyAdminToken } from "../Middleware/adminMiddleware";

const router = Router()
const adminService  = new AdminService
const adminController = new AdminController(adminService);

router.post('/verifyAdmin',adminController.verifyAdmin);
router.get('/getUsers',verifyAdminToken,adminController.getUsers);
router.get('/getFreelancers',verifyAdminToken,adminController.getFreelancers)
router.get('/getfreelancerapplications',verifyAdminToken, adminController.getFreelancerApplication)
router.put('/updatefreelancerstatus/:applicationId',verifyAdminToken,adminController.updateFreelancerStatus)
router.put('/blockfreelancer/:email',verifyAdminToken,adminController.blockFreelancer)
router.put('/blockUser/:email',verifyAdminToken,adminController.blockUser)
router.post('/adminlogout',adminController.adminLogout)
router.post('/category',verifyAdminToken,adminController.createCategory)
router.get('/getcategories',adminController.getCategories)
router.delete('/deletecategory/:name',verifyAdminToken,adminController.deleteCategory)
router.put('/blockcategory/:categoryName',verifyAdminToken,adminController.blockunblockCategory)
router.get('/getFreelancerDetails/:freelancerId',verifyAdminToken,adminController.getFreelancerDetails)
router.get('/joblist',verifyAdminToken,adminController.getJobList)
router.post('/activatejob',verifyAdminToken,adminController.activateJob)

export default router