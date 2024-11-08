import { IUser } from "../Interfaces/common.interface"
import { UserRepository } from "../Repository/userRepository"
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from "uuid"
import sendOTPMail from "../Config/emailConfig"
import { createRefreshToken, createToken } from "../Config/jwtConfig"
import AppError from "../utils/AppError"
import { IJob } from "../Models/jobSchema"
import { address } from "../Models/userSchema"
import { AwsConfig } from "../Config/awsFileConfig"
import { User } from "aws-sdk/clients/budgets"

const aws = new AwsConfig()

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
        userInfo: { name: string, email: string, userId: string, isBlocked: boolean, createdAt: string, isFreelancer: boolean },
        accessToken: string,
        refreshToken: string
    } | null> => {
        try {
            const userExist = await UserRepository.verifyLogin(email, password)
            if (!userExist) {
                throw { message: 'Invalid login credentials' }
            }
            if (userExist.isBlocked == true) {
                throw { message: 'User is blocked' }
            }

            const compare = await bcrypt.compare(password, userExist.password)

            if (!compare) {
                throw { message: 'Incorrect password' }
            }
            const userInfo = {
                userId: userExist.userId,
                name: userExist.name,
                email: userExist.email,
                // phone: userExist.phone,
                isBlocked: userExist.isBlocked,
                createdAt: userExist.createdAt.toISOString().slice(0, 10),
                isFreelancer: userExist.isFreelancer
            }
            const accessToken = createToken(userExist.userId, "user");

            const refreshToken = createRefreshToken(userExist.userId, "user");

            return { accessToken, refreshToken, userInfo };
        } catch (error: any) {
            throw { message: error.message || 'Internal server error' }
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
            const emailExist = await UserRepository.verifyEmail(email)
            if (!emailExist) {

                throw new Error('Email is not valid')

            } else {

                const generateOtp: string = Math.floor(100000 + Math.random() * 900000).toString()
                console.log(generateOtp)
                this.OTP = generateOtp
                const isMailSend = await sendOTPMail(email, generateOtp)
                if (!isMailSend) {
                    return { email: '', bool: false }

                }
                const otp_time = new Date()
                this.email = email
                this.expiryOTP_time = new Date(otp_time.getTime() + 2 * 60 * 1000)
                return { email: email, bool: true }
            }
        } catch (error: any) {
            throw { message: error.message || 'Internal server error' }
        }
    }

    verifyForgotOtp = async (otp: string): Promise<boolean> => {
        try {

            if (!this.OTP || !this.expiryOTP_time) {
                throw new Error('OTP not initialized');
            }

            const actualOtp = this.OTP;

            const currentTime = new Date();

            const expiryTime = new Date(this.expiryOTP_time);

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

    changePassword = async (password: string) => {
        try {
            const email = this.email
            if (!email) {
                throw { statusCode: 400, message: 'mail is required' }
            }

            const hashPassword = await bcrypt.hash(password, 10)
            const user = await UserRepository.changePassword(hashPassword, email)

            if (!user) {
                throw { statusCode: 404, message: ' User not found ' }
            }
            return user
        } catch (error: any) {
            throw { statusCode: error.statusCode || 500, message: error.message || 'Internal server Error' }
        }
    }

    createJobService = async (data: any, id: string) => {
        try {
            const jobInfo = {
                userId: id,
                title: data.jobTitle,
                description: data.jobDescription,
                skillsRequired: data.skills,
                budget: data.budget,
                category: data.category,
                deadLine: data.deadline,
                language: data.language
            }
            const create = await UserRepository.createJob(jobInfo)

            if (create) {
                return true
            } else {
                return false
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    addAddressService = async (data: address, id: string) => {
        try {
            const addressInfo = {
                address: data.address,
                country: data.country,
                state: data.state,
                city: data.city,
                pincode: data.pincode
            }
            const createData = await UserRepository.addAddress(addressInfo, id)
            return true
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getUserService = async (id: string) => {
        try {
            const data = await UserRepository.getUserInfo(id)
            if (!data) {
                throw new Error('No data have found')
            }
            return data
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getFreelancerInfoService = async () => {
        try {
            const result: any = await UserRepository.getFreelancerDetails()

            let image = ''
            let freelancerData = []
            for (let data of result) {
                console.log(data.photo?.fileurl, 'this is the data')
                image = (await aws.getFile('freelancerApplication/photo', data.photo?.fileurl))
                const updatedData = {
                    userId: data.userId,
                    applicationId: data.applicationId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    profile: image,
                    description: data.description,
                    language: data.language,
                    experience: data.experience,
                    skills: data.skills,
                    education: data.education,
                    certification: data.certification,
                    portfolio: data.portfolio,
                    email: data.email,
                    phone: data.phone
                }
                freelancerData.push(updatedData)
            }



            // let certImg = ''
            // for(let image in freelancerData.certficatImage){
            //     certImg = await aws.getFile('freelancerApplication/certification',image)
            // }
            // console.log(certImg,'this is the certificate image')
            return { freelancerData }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    userChangePasswordService = async (formData: any, userId: string) => {
        try {
            console.log(userId,'its here')
            console.log(formData,'this is the form data')
            // let { currentPassword, newPassword, confirmPassword } = value
            const userData = await UserRepository.getUserInfo(userId)
            if (!userData) {
                throw new Error('No data Found')
            }
            
            if (userData.isBlocked === true) {
                throw new Error('User is blocked')
            }
            const compare = await bcrypt.compare(formData.newPassword, userData.password)
            if (compare) {
                throw { message: 'Current Password and New Password is same, Please use another password' }
            }
            if(formData.newPassword !== formData.confirmPassword){
                throw new Error('both password should be same')
            }
            const hashPassword = await bcrypt.hash(formData.newPassword, 10)
            const updatedData = await UserRepository.userChangePassword(hashPassword, userId)
            return updatedData
        } catch(error: any) {
            console.log(error.message)
            throw new Error(error.message)
        }
    }

    googleSignupService = async(name:string, email:string, password:string)=>{
        try {
            console.log('ohh its herer')
            const existUser = await UserRepository.findByEmail(email)
            if(existUser){
                return{
                    status:200,
                    data:false
                }
            }else{
                console.log('its here')
                const userId = uuidv4()
                const saltRounds: number = 10;
                const hashPassword = await bcrypt.hash(password,saltRounds)
                const userSave = await UserRepository.saveUser({userId,name,email,password:hashPassword}as IUser)
                return {
                    status:200,
                    data:userSave
                }
            }
        } catch (error) {
            
        }
    }


}