import { IUser } from "../Interfaces/common.interface"
import { UserRepository } from "../Repository/userRepository"
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from "uuid"
import sendOTPMail from "../Config/emailConfig"
import { createRefreshToken, createToken } from "../Config/jwtConfig"
import AppError from "../utils/AppError"
import { IJob } from "../Models/jobSchema"

export class UserService {
    private userData: IUser | null = null
    private OTP: string | null = null
    private expiryOTP_time: Date | null = null
    private email: string | null = null
    register = async (userData: IUser): Promise<void> => {
        try {
            const existUser = await UserRepository.existUser(userData.email)
            if (existUser) {
                throw new Error('Email already in use')
            }
            const saltRounds: number = 10;
            const hashPassword = await bcrypt.hash(userData.password, saltRounds)


            const userId = uuidv4()
            const tempData = {
                userId: userId,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: hashPassword,
                created_At: new Date(),
            }
            this.userData = tempData
            const generateOtp: string = Math.floor(100000 + Math.random() * 900000).toString()
            console.log(generateOtp)
            this.OTP = generateOtp
            const isMailSend = await sendOTPMail(userData.email, generateOtp)

            if (!isMailSend) {
                throw new Error('Failed to send OTP to email');
            }
            const otp_time = new Date()
            this.expiryOTP_time = new Date(otp_time.getTime() + 2 * 60 * 1000)
            return
        } catch (error) {
            throw error
        }
    }

    verifyOtp = async (email: string, otp: string) => {
        try {
            const actualOtp = this.OTP;
            const userData = this.userData;
            const currentTime = new Date();
            const expiryTime: any = this.expiryOTP_time;


            if (currentTime > expiryTime) {
                throw new Error('OTP has expired');
            } else {
                if (actualOtp !== otp) {
                    throw new Error('Wrong OTP');
                }
                await UserRepository.createUser(userData);
                this.OTP = null;
                this.expiryOTP_time = null;
                this.userData = null;
            }
            return true;
        } catch (error: any) {
            throw new Error(error.message);
        }
    };


    login = async (email: string, password: string): Promise<{
        userInfo: { name: string, email: string, phone: string, userId: string, isBlocked: boolean, created_At: string,  isFreelancer: boolean },
        accessToken: string,
        refreshToken: string
    } | null> => {
        try {
            console.log(password,'this is the user password')
            const userExist = await UserRepository.verifyLogin(email, password)
            console.log('the user data we got is ', userExist)
            if (!userExist) {
                throw {message: 'Invalid login credentials'}
            }
            if(userExist.isBlocked == true){
                throw {message: 'User is blocked'}
            }
           
            const compare = await bcrypt.compare(password,userExist.password)
        
            if(!compare){
                throw {message:'Incorrect password'}
            }
            const userInfo = {
                userId: userExist.userId,
                name: userExist.name,
                email: userExist.email,
                phone: userExist.phone,
                isBlocked: userExist.isBlocked,
                created_At: userExist.created_At.toISOString().slice(0, 10),
                isFreelancer: userExist.isFreelancer
            }

            const accessToken = createToken(userExist.userId, "user");

            const refreshToken =  createRefreshToken(userExist.userId, "user");

            return { accessToken, refreshToken, userInfo };
        } catch (error:any) {
            throw {message: error.message || 'Internal server error'}
        }
    }

    resendOtp = async () => {
        try {
            const generatedOtp: string = Math.floor(100000 + Math.random() * 900000).toString()
            this.OTP = generatedOtp
            const sendEmail = await sendOTPMail(this.userData!.email, generatedOtp)
            if (!sendEmail) {
                throw new Error('Email not send')
            }
            const create_time = new Date()
            this.expiryOTP_time = new Date(create_time.getTime() + 2 * 60 * 1000)
        } catch (error) {
            throw error
        }
    }

    verifyEmailAndSendOTP = async (email: string) => {
        try {
            console.log('its herererererer')
            const emailExist = await UserRepository.verifyEmail(email)
            if (!emailExist) {

                throw new Error('Email is not valid')
                
            } else {

                const generateOtp: string = Math.floor(100000 + Math.random() * 900000).toString()
                console.log(generateOtp)
                this.OTP = generateOtp
                const isMailSend = await sendOTPMail(email, generateOtp)
                if (!isMailSend) {
                    return {email:'',bool:false}
                    
                }
                const otp_time = new Date()
                this.email = email
                this.expiryOTP_time = new Date(otp_time.getTime() + 2 * 60 * 1000)
                return {email:email, bool:true}
            }
        } catch (error: any) {
            throw {message: error.message || 'Internal server error'}
        }
    }

    verifyForgotOtp = async (otp: string): Promise<boolean> => {
        try {
            console.log('Verifying OTP:', otp);
            
            if (!this.OTP || !this.expiryOTP_time) {
                throw new Error('OTP not initialized');
            }
    
            const actualOtp = this.OTP;
            console.log('Actual OTP:', actualOtp);
    
            const currentTime = new Date();
            console.log('Current time:', currentTime);
    
            const expiryTime = new Date(this.expiryOTP_time);
            console.log('Expiry time:', expiryTime);
    
            if (currentTime > expiryTime) {
                throw new Error('OTP has expired');
            }
    
            if (actualOtp !== otp) {
                throw new Error('Wrong OTP');
            }

            this.OTP = null;
            this.expiryOTP_time = null;
            
            return true;
        } catch (error: any) {
            console.error('Error in verifyForgotOtp:', error.message);
            throw error; 
        }
    }

    changePassword = async(password : string)=>{
        try {
            const email = this.email
            if(!email){
                throw {statusCode : 400, message:'mail is required'}
            }

            const hashPassword = await bcrypt.hash(password,10)
            const user = await UserRepository.changePassword(hashPassword , email)

            if(!user){
                throw {statusCode: 404, message:' User not found '}
            }
            return user
        } catch (error: any) {
            throw { statusCode: error.statusCode || 500, message: error.message || 'Internal server Error'}
        }
    }

    createJobService = async(data: any)=>{
        try {
            const jobInfo = {
                title: data.jobTitle,
                description: data.jobDescription,
                skillsRequired: data.skills,
                budget: data.budget,
                category: data.category,
                deadLine: data.deadline,
                language: data.language
            }
            const create = await UserRepository.createJob(jobInfo)
            
            if(create){
                return true
            }else{
                return false
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }
}