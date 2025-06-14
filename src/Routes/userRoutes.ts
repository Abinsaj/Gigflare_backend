import { Router } from "express";
import { UserController } from "../Controllers/userController";
import { UserService } from "../Services/userServices";
import verifyToken from "../Middleware/userMiddleware";
import multer from "multer";
import { UserRepository } from "../Repository/userRepository";
import userModel from "../Models/userSchema";
import jobModel from "../Models/jobSchema";
import FreelancerApplication from "../Models/applicationSchema";
import CategorySchema from "../Models/categorySchema";
import ProposalModel from "../Models/proposalSchema";
import NotificationModel from "../Models/notificationSchema";
import ContractSchema from "../Models/contractSchema";
import ReviewSchema from "../Models/reviewSchema";
import SkillSchema from "../Models/skillSchema";
import jobOfferModel from "../Models/jobOfferSchema";

const router = Router()

const storage = multer.memoryStorage();
const upload = multer({ storage: storage})

const userRepository = new UserRepository(
    userModel,
    jobModel,
    FreelancerApplication,
    CategorySchema,
    ProposalModel,
    NotificationModel,
    ContractSchema,
    ReviewSchema,   
    SkillSchema,
    jobOfferModel
);
const userServive = new UserService(userRepository);
const userController = new UserController(userServive);

router.post('/register',userController.createUser);
router.post('/otpVerification',userController.verifyOtp)
router.post('/login',userController.verifyLogin)
router.post('/resendOtp',userController.resendOtp)
router.post ('/forgotEmail',userController.verifyEmail)
router.post('/verifyforgototp',userController.verifyForgotOtp)
router.post('/changepassword',userController.changePassword)
router.post('/createjob',verifyToken,userController.createJob)
router.post('/addAddress/:id',verifyToken,userController.addAddress)
router.get('/userInfo/:id',verifyToken,userController.getUserInfo)
router.get('/getfreelancers',verifyToken,userController.getFreelancerInfo)
router.put('/changePassword',verifyToken,userController.userChangePassword)
router.post('/google',userController.googleSignIn)
router.get('/getsinglejob',verifyToken,userController.getSigleJob)
router.get('/getcategory',verifyToken,userController.getCategoryList)
router.get('/getproposals/:id',verifyToken, userController.getProposals)
router.put('/approveproposal/:id',verifyToken, userController.approveProposal)
router.post('/userlogout',userController.userLogout)
router.post('/sendoffer',upload.single('attachment'),userController.sendJobOffer)
router.get('/getcontracts/:id',verifyToken,userController.getContracts)
router.post('/signcontract',verifyToken,userController.signContract)
router.post('/create-checkout-session',userController.createCheckoutSession)
router.all('/confirmpayment',userController.confirmPayment)
router.get('/notification/:id',verifyToken,userController.getUserNotification)
router.put('/viewedproposalnotification/:id',verifyToken,userController.viewedNotification)
router.put('/viewmessagenotification',verifyToken,userController.viewedMessageNotification)
router.get('/getworkhistory/:id',verifyToken,userController.getWorkHistory)
router.post('/addratingreview',verifyToken, userController.addRatingAndReview)
router.get('/getReview/:id',verifyToken,userController.getRatingAndReview)
router.get('/gettransactions/:id',verifyToken,userController.getTransactions)
router.get('/getskills',verifyToken,userController.getSkills)
router.get('/getsinglecontract/:id',verifyToken, userController.getSingleContracts)
router.post('/updateprofile',verifyToken,userController.updatePriofile)


export default router;
