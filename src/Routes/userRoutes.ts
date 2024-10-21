import { Router } from "express";
import { UserController } from "../Controllers/userController";
import { UserService } from "../Services/userServices";


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

export default router;