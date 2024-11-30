import { Router } from "express";
import { UserController } from "../Controllers/userController";
import { UserService } from "../Services/userServices";
import verifyToken from "../Middleware/userMiddleware";

const router = Router()

const userServive = new UserService();
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
router.post('/google',verifyToken,userController.googleSignIn)
router.get('/getsinglejob/:id',verifyToken,userController.getSigleJob)
router.get('/getcategory',verifyToken,userController.getCategoryList)
router.get('/getproposals/:id',verifyToken, userController.getProposals)
router.put('/approveproposal/:id',verifyToken, userController.approveProposal)
router.post('/userlogout',userController.userLogout)
router.post('/sendoffer',userController.sendJobOffer)
router.get('/getcontracts/:id',verifyToken,userController.getContracts)
router.post('/signcontract',verifyToken,userController.signContract)
router.post('/create-checkout-session',userController.createCheckoutSession)
router.all('/confirmpayment',userController.confirmPayment)



export default router;