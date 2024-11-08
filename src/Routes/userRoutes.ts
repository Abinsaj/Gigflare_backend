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
router.get('/userInfo/:id',userController.getUserInfo)
router.get('/getfreelancers',userController.getFreelancerInfo)
router.put('/changePassword',userController.userChangePassword)
router.post('/google',userController.googleSignIn)
// router.post('/googlelogin',userController.googleLogin)

export default router;