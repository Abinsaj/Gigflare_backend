import { Router } from "express";
import { FreelancerController } from "../Controllers/freelancerControllers";
import { FreelancerService } from "../Services/freelancerServices";
import multer from "multer";
import verifyToken from "../Middleware/userMiddleware";

const router = Router();

const freelancerService = new FreelancerService();
const freelancerController = new FreelancerController(freelancerService);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const flexibleUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certification', maxCount: 5 }, 
  
]);


const handleMulterError = (err: any, req:any, res:any, next:any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload error', details: err.message });
  }
  next(err);
};

router.post('/application/:userId',flexibleUpload,handleMulterError,freelancerController.verifyApplication);
router.get('/getDetails/:id',verifyToken,freelancerController.getSingleDetails)
router.get('/getJobDetails/:id',verifyToken,freelancerController.getJobDetails)
router.post('/updateprofile/:id', upload.single('photo'),freelancerController.updateProfile)
router.post('/proposal',verifyToken,freelancerController.createProposals)
router.get('/getproposals/:id',verifyToken,freelancerController.getProposals)
router.get('/getjoboffer/:id',verifyToken,freelancerController.getJobOffers)
router.post('/acceptjoboffer',verifyToken,freelancerController.acceptRejectOffer)
router.get('/getcontracts/:id',verifyToken,freelancerController.getContracts)
router.post('/signcontract',verifyToken,freelancerController.signContract)
router.post('/statuschange/:id',verifyToken,freelancerController.changeStatus)
router.post('/deleteproposal/:id',verifyToken,freelancerController.removeProposal)
router.get('/notifications/:id',verifyToken,freelancerController.getNotification)
router.get('/getworkhistory/:id',verifyToken,freelancerController.getWorkHistory)
router.get('/getskills/:id',verifyToken,freelancerController.getSkillList)
router.get('/filteredjob',verifyToken,freelancerController.getFilteredData)
router.get('/dashboarddata/:id',verifyToken,freelancerController.getDashboardData)
router.get('/ratingreview/:id',verifyToken,freelancerController.getRatingReview)

export default router;