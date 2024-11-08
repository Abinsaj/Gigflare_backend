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
router.put('/updatefreelancerstatus/:applicationId',adminController.updateFreelancerStatus)
router.put('/blockfreelancer/:email',adminController.blockFreelancer)
router.put('/blockUser/:email',adminController.blockUser)
router.post('/adminlogout',adminController.adminLogout)
router.post('/category',adminController.createCategory)
router.get('/getcategories',adminController.getCategories)
router.delete('/deletecategory/:name',adminController.deleteCategory)
router.put('/blockcategory/:categoryName',adminController.blockunblockCategory)
router.get('/getFreelancerDetails/:freelancerId',adminController.getFreelancerDetails)
router.get('/joblist',adminController.getJobList)
router.post('/blockjob/:id',adminController.blockJob)

export default router