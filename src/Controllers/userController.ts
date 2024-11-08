import { Request, Response } from "express";
import { IUser } from "../Interfaces/common.interface";
import { UserService } from "../Services/userServices";
import HTTP_statusCode from "../Enums/httpStatusCode";
import { UserRepository } from "../Repository/userRepository";
import jwtDecode from 'jwt-decode'
import axios from "axios";

export class UserController {
    private userService: UserService;
    constructor(userService: UserService) {
        this.userService = userService;
    }

    createUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const userData: IUser = req.body
            await this.userService.register(userData)
            res.status(HTTP_statusCode.OK).send({success:true,message:'OTP has send to the mail'})
        } catch (error: any) {
            res.status(HTTP_statusCode.Conflict).json({success:false, message: error.message || "Registration Failed"})
            
        }
    }

    verifyOtp = async (req: Request, res: Response): Promise<void> => {
        try {
            const data = req.body;
            await this.userService.verifyOtp(data.email, data.otp);
            res.status(HTTP_statusCode.OK).send({ message: 'verified' });
        } catch (error: any) {
            if (error.message === 'Wrong OTP') {
                res.status(HTTP_statusCode.Conflict).send({ message: 'Wrong OTP' });
            } else if (error.message === 'OTP expired or not found') {
                res.status(HTTP_statusCode.BadRequest).send({ message: 'OTP expired or not found' });
            } else if (error.message === 'OTP has expired') {
                res.status(HTTP_statusCode.BadRequest).send({ message: 'OTP has expired' });
            } else {
                res.status(HTTP_statusCode.InternalServerError).send({ message: 'Internal server error' });
            }
        }
    };
    

    verifyLogin = async (req: Request, res: Response): Promise<any> => {
        try {
            const data = req.body
            const result = await this.userService.login(data.email, data.password);
            if (!result) {
                return res.status(HTTP_statusCode.Unauthorized).json({success:false, message: "Invalid login credentials" })
            }

            console.log(result.accessToken, ' this is the result we got from the user service')
            console.log(result.refreshToken, ' this is the result we got from the user service')

            res.cookie('UserAccessToken',result.accessToken,{
                httpOnly: true,
                sameSite: "none",
                secure: true,
                maxAge: 60 * 1000,
            })

            res.cookie('UserRefreshToken',result.refreshToken,{
                httpOnly: true,
                sameSite: "none",
                secure: true,
                maxAge: 7 * 24 * 60 * 60 * 10000
            })

            const { userInfo } = result;
            const cred = { userInfo };
            res.status(HTTP_statusCode.OK).json({success: true, message: 'Login successful', cred });

        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({success: false, message: error.message });
        }
    }

    resendOtp = async(req: Request, res: Response) =>{
        try {
            await this.userService.resendOtp()
            res.status(HTTP_statusCode.OK).send('OTP sended')
        } catch (error: any) {
            if(error.message == 'Email not send'){
                res.status(HTTP_statusCode.InternalServerError).json({message: "Email not send"})
            }else{
                res.status(HTTP_statusCode.InternalServerError).json({message: "Something went wrong..."})
            }
        }
    }
    
    verifyEmail = async(req: Request, res: Response)=>{
        try {
            const {email} = req.body
            const verify = await this.userService.verifyEmailAndSendOTP(email)
            
            if(verify.bool){
                res.cookie('Email', verify.email, {
                    httpOnly: true,
                    sameSite: "strict",
                    maxAge: 15 * 60 * 1000,
                });

                res.status(HTTP_statusCode.OK).json('Email verified otp has sent')
            } else {
                res.status(HTTP_statusCode.BadRequest).json({
                    message: 'Email verification failed or email not found.'
                });
            }
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json(error.message)
        }
    }

    verifyForgotOtp = async(req: Request, res: Response)=>{
        try {

            const {otpValue} = req.body
            const result = await this.userService.verifyForgotOtp(otpValue)

            if(result){

                res.status(HTTP_statusCode.OK).json('verified')
            }else{
                res.status(HTTP_statusCode.BadRequest).json('Wrong OTP')
            }
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).send('Internal server error' )
        }
    }

    changePassword = async(req: Request, res: Response)=>{
        try {
            const {password} = req.body

            if(!password){
                res.status(HTTP_statusCode.BadRequest).json({success:false, message:'password is required'})
            }

            const result = await this.userService.changePassword(password)
            res.status(HTTP_statusCode.OK).json({success: true, message:'Password changes successfully'})
        } catch (error:any) {
            res.status(error.statusCode || 500).json({success: false, message: error.message || 'An error occured'})
        }
    }

    createJob = async(req:Request, res:Response)=>{
        try {
            const data = req.body.values
            const id = req.body.id
            console.log(id,'this the id of the user we got while creating the job')
            const created = await this.userService.createJobService(data,id)
            if(created){
                res.status(HTTP_statusCode.OK).json({success:true,message:'Job created successfully'})
            }else{
                res.status(HTTP_statusCode.BadRequest).json({success:false,message:'Failed to create job'})
            }
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({success: false,message:error.message})
        }
    }

    addAddress = async(req: Request, res: Response) => {
        try {
            const {id} = req.params
            const data = req.body
            const create = await this.userService.addAddressService(data,id)
            if(create){
                res.status(HTTP_statusCode.OK).json({success: true, message:'Address added successfully'})
            }else{
            res.status(HTTP_statusCode.BadRequest).json({success: false, message:'Failed to add address'})
            }
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({success:false, message:error.message})
        }
    }

    getUserInfo = async(req:Request, res: Response)=>{
        try {
            const {id} = req.params
            const data = await this.userService.getUserService(id)
            res.status(HTTP_statusCode.OK).json({success: true, data})
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json({success:false, message: 'failed to fetch data'})
        }
    }

    getFreelancerInfo = async(req:Request, res: Response)=>{
        try {
            console.log('yeah we reached here')
            const freelancerData: any = await this.userService.getFreelancerInfoService()
            console.log(freelancerData,' this is the data we got from the repository')
            res.status(HTTP_statusCode.OK).json(freelancerData)
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json(error.message)
        }
    }

    userChangePassword = async(req:Request,res: Response)=>{
        try {
            console.log(req.body,'value we got here is')
            const {formData}= req.body
            
            const {id} = req.body
            console.log(id,'this is the id')
            
            // const {currentPassword, newPassword, confirmPassword} = data
            // if(newPassword !== confirmPassword){
            //     res.status(HTTP_statusCode.OK).json({success:false,message: 'password should be same'})
            // }
            console.log('alfhaia')
            const result = await this.userService.userChangePasswordService(formData,id)
            
            if(result){
                res.status(HTTP_statusCode.OK).json({success:true,message: 'password change sucessfully',result})
            }
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json(error.message)

        }
    }

    googleSignIn = async(req: Request, res: Response)=>{
        try {
            const {tokenResponse} = req.body
            console.log(tokenResponse,'this is the access token we get here')
            const result = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{
                'Authorization':`Bearer ${tokenResponse.access_token}`
            }})
            console.log(result,'this is the result we got')
            const name = result.data.given_name +''+result.data.family_name
            const email = result.data.email
            const password = 'Gig@flare'
            const data = await this.userService.googleSignupService(name,email,password)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error) {
            
        }
    }

    // googleLogin = async(req:Request, res: Response)=>{
    //     try {
    //         const {tokenResponse} = req.body
    //         console.log(tokenResponse,'this is the access token we get here')
    //         const result = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{
    //             'Authorization':`Bearer ${tokenResponse.access_token}`
    //         }})
    //         console.log(result,'this is the result we got')
    //         const name = result.data.given_name +''+result.data.family_name
    //         const email = result.data.email
    //         const password = 'Gig@flare'
    //         const data = await this.userService.googleLoginService(name,email,password)
    //         res.status(HTTP_statusCode.OK).json(data)
    //     } catch (error) {
            
    //     }
    // }
}