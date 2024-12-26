import { Request, Response } from "express";
import { IUser } from "../Interfaces/common.interface";
import { UserService } from "../Services/userServices";
import HTTP_statusCode from "../Enums/httpStatusCode";
import { UserRepository } from "../Repository/userRepository";
import jwtDecode from 'jwt-decode'
import axios, { HttpStatusCode } from "axios";
import AppError from "../utils/AppError";
import { AdminRepository } from "../Repository/adminRepository";
import { ObjectId } from "mongoose";

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
            const value = req.body.formData
            const id = req.body.id
            const created = await this.userService.createJobService(value,id)
            if(created.bool == true){
                const data = created.data
                res.status(HTTP_statusCode.OK).json({success:true,message:'Job created successfully',data:data})
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
            console.log(req.query,'yeah we reached here')
            const {id, page, limit} = req.query;
            const freelancerData: any = await this.userService.getFreelancerInfoService(id,page, limit)
            console.log(freelancerData,'Freelancer Data')
            console.log(freelancerData,' this is the data we got from the repository')
            res.status(HTTP_statusCode.OK).json(freelancerData)
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json(error.message)
        }
    }

    userChangePassword = async(req:Request,res: Response)=>{
        try {
            const {formData}= req.body
            
            const {id} = req.body
            
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
            const name = result.data.given_name +''+result.data.family_name
            const email = result.data.email
            const password = 'Gig@flare'
            const data = await this.userService.googleSignupService(name,email,password)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json(error)
        }
    }

    getSigleJob = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const result = await UserRepository.getUserJob(id)
            res.status(HTTP_statusCode.OK).json(result)
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json(error)
        }
    }

    getCategoryList = async(req: Request, res: Response)=>{
        try {
            const data = await UserRepository.getCategories()
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json(error)
        }
    }

    getProposals = async(req: Request, res: Response)=>{
        try {
            console.log(req.body,'its here in the controller')
            const {id} = req.params
            console.log(id)
            const data = await this.userService.getProposalServices(id)
            console.log(data)
            res.status(HTTP_statusCode.OK).json({success: true,data:data})
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json({success: false, message: 'An enexpected error has occured'})
        }
    }

    approveProposal = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const {status} = req.body
            console.log(id,'..........',status,'afhoahgoqehgoqg')
            const data = await this.userService.approveProposalService(id, status)
            if(data?.status === 'approved'){
                res.status(HTTP_statusCode.OK).json({success: true, message: 'Proposal approved'})
            }else if(data?.status == 'rejected'){
                res.status(HTTP_statusCode.OK).json({success: false, message: 'Proposal rejected'})
            }else{
                res.status(HTTP_statusCode.NoChange).json({message:'No change'})
            }
        } catch (error: any) {
            res.status(HttpStatusCode.InternalServerError).json({message:'An error has occured',error})
        }
    }

    userLogout = async(req: Request, res: Response)=>{
        try {
            res.clearCookie('UserAccessToken')
            res.status(HTTP_statusCode.OK).json({success: true, message: 'User Logged out'})
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json({success: false, message: 'Error'})
        }
    }

    sendJobOffer = async(req: Request, res: Response)=>{
        try {
            const { freelancerId, jobId, userId } = req.query; 
            const { budget, fromDate, toDate, jobTitle, description, upfrontAmount, completionAmount, platformFeeAmount } = req.body;
            const attachment = req.file;

        if (!freelancerId || !jobId || !userId) {
             res.status(HTTP_statusCode.BadRequest).json({ success: false, message: 'Missing required query parameters.' });
        }

        if (!budget || !fromDate || !toDate || !jobTitle || !description) {
             res.status(HTTP_statusCode.BadRequest).json({ success: false, message: 'Missing required fields in offer data.' });
        }

        const offerData = {
            budget,
            fromDate,
            toDate,
            jobTitle,
            description,
            upfrontAmount,
            completionAmount,
            platformFeeAmount,
            attachmentPath: attachment,
        };
            const data = await this.userService.sendJobOfferService(offerData, freelancerId as string, jobId as string ,userId as string )
            if(data == true){
                res.status(HTTP_statusCode.OK).json({success: true, message:'offer has been sent to the user'})
            }else{
                res.status(HTTP_statusCode.OK).json({success: true, message:'Offer has already sent to the user'})
            }
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json('An unexpected error has been occured')
        }
    }

    getContracts = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const result = await this.userService.getContractService(id)
            res.status(HTTP_statusCode.OK).json(result)
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    signContract = async(req: Request, res: Response)=>{
        try {
            const {hash, contractId, userId} = req.body;
            const result = await this.userService.signContractService(hash, contractId, userId)
            if(result.success){
                res.status(HTTP_statusCode.OK).json({success: result.success,message:'Contract signed', key: result.privateKey,signature: result.signature})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    createCheckoutSession = async(req: Request, res: Response)=>{
        try {
            console.log(req.body,'this is the body')
            const {data} = req.body
            const result = await this.userService.createCheckoutSessionService(data.id, data.initialPayment, data.remainingPayment)
            if(result){
                res.status(HTTP_statusCode.OK).json(result)
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    confirmPayment = async(req: Request, res: Response)=>{
        try {
            const { session_id } = req.query; 

        if (!session_id) {
            throw AppError.badRequest('Session ID is required');
        }

        const data = await this.userService.confirmPaymentService(session_id as string);

        if (data) {
            res.redirect(`${process.env.CLIENT_URL}/success`);
        }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getUserNotification = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params;
            const data = await UserRepository.getNotification(id)
            console.log(data, 'we got the notification data')
            if(data){
                res.status(HTTP_statusCode.OK).json({success: true, data})
            }else{
                res.status(HTTP_statusCode.NotFound).json({success: false, message: 'No notificaion found'})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    viewedNotification = async(req: Request, res: Response)=>{
        try {
            console.log(req.body,'this is the body things')
            const {id} = req.params
            const {type} = req.body
            
            const data = await UserRepository.changeNotificationStaus(id, type)
            if(data){
                res.status(HTTP_statusCode.OK).json({success: true, data})
            }else{
                res.status(HTTP_statusCode.NoChange).json({success: false})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    viewedMessageNotification = async(req: Request, res: Response)=>{
        try {
            console.log(req.body,'its herererererererererereeerererer')
            const {userId, otherId} = req.body
            const data = await UserRepository.messageNotificationChange(userId, otherId) 
            if(data){
                res.status(HTTP_statusCode.OK).json({success: true, data})
            }else{
                res.status(HTTP_statusCode.NoChange).json({success: false})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getWorkHistory = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const data = await this.userService.getWorkHistoryService(id)
            if(!data){
                res.status(HTTP_statusCode.NotFound).json({success: false})
            }else{
                res.status(HTTP_statusCode.OK).json({success: true, data})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    addRatingAndReview = async(req: Request, res: Response)=>{
        try {
           
            const { data } = req.body
            const result = await this.userService.addRatingAndReviewService(data)
            if(result){
                res.status(HTTP_statusCode.OK).json({success: true, message:'Your review has been added', data:result})
            }else{
                res.status(HTTP_statusCode.TaskFailed).json({success: false, message: 'Failed to add rating and review'})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getRatingAndReview = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const data = await UserRepository.getReviews(id)
            res.status(HTTP_statusCode.OK).json({success: true, data})
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getTransactions = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const data = await this.userService.getTransactionService(id)
            if(data.length > 0){
                res.status(HTTP_statusCode.OK).json({success: true, data})
            }else{
                res.status(HTTP_statusCode.NotFound).json({success: false, message: 'No transaction found'})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getSkills = async(req: Request, res: Response)=>{
        try {
            const data = await UserRepository.getSkills()
            res.status(HTTP_statusCode.OK).json({success: true, data})
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getSingleContracts = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const contractId: any = id
            const data = await UserRepository.getSingleContract(contractId)
            res.status(HTTP_statusCode.OK).json({ success: true, data})
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

}