import { Router } from "express";
import { AdminController } from "../Controllers/adminControllers";
import { AdminService } from "../Services/adminServices";
import { verifyAdminToken } from "../Middleware/adminMiddleware";
import { AdminRepository } from "../Repository/adminRepository";
import userModel from "../Models/userSchema";
import FreelancerApplication from "../Models/applicationSchema";
import CategorySchema from "../Models/categorySchema";
import { FreelancerRepository } from "../Repository/freelancerRepository";
import jobModel from "../Models/jobSchema";
import ProposalModel from "../Models/proposalSchema";
import jobOfferModel from "../Models/jobOfferSchema";
import ContractSchema from "../Models/contractSchema";
import NotificationModel from "../Models/notificationSchema";
import SkillSchema from "../Models/skillSchema";
import ReviewSchema from "../Models/reviewSchema";

const router = Router()

const adminRepository = new AdminRepository(
    userModel,
    FreelancerApplication,
    CategorySchema,
    jobModel,
    ContractSchema,
    SkillSchema
)
const freelancerRepository = new FreelancerRepository(
    CategorySchema,
    FreelancerApplication,
    jobModel,
    ProposalModel,
    jobOfferModel,
    ContractSchema,
    NotificationModel,
    SkillSchema,
    ReviewSchema
)
const adminService  = new AdminService(adminRepository, freelancerRepository)
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
router.get('/getcontracts',verifyAdminToken,adminController.getContracts)
router.post('/skills',verifyAdminToken,adminController.createSkills)
router.get('/getskills',verifyAdminToken,adminController.getSkills)
router.put('/blockunblockskill',verifyAdminToken,adminController.blockUnblockSkill)
router.get('/getalltransactions',verifyAdminToken,adminController.getAllTransactions)
router.get('/getdashboarddata',verifyAdminToken,adminController.getDashboardData)
router.get('/getgraphdata/:timeframe', verifyAdminToken,adminController.getGraphData)

export default router