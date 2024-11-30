import { IUser } from "../Interfaces/common.interface"
import { UserRepository } from "../Repository/userRepository"
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from "uuid"
import sendOTPMail from "../Config/emailConfig"
import { createRefreshToken, createToken } from "../Config/jwtConfig"
import { address } from "../Models/userSchema"
import { AwsConfig } from "../Config/awsFileConfig"
import AppError from "../utils/AppError"
import { ObjectId } from "mongoose"
import generateKeyPair from "../utils/GenerateKeyPair"
import signWithPrivateKey from "../utils/Signature"
import Stripe from "stripe"

require('dotenv').config()


const aws = new AwsConfig()
const stripe = new Stripe(process.env.STRIPE_SECRET! as string)
console.log(stripe,'this is the api key')

export class UserService {
    private userData: IUser | null = null
    private OTP: string | null = null
    private expiryOTP_time: Date | null = null
    private email: string | null = null
    private contractId: ObjectId | null = null
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
        userInfo: { _id: string, name: string, email: string, userId: string, isBlocked: boolean, createdAt: string, isFreelancer: boolean },
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
                _id: userExist._id,
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
            const user = await UserRepository.getUserInfo(id)
            console.log(user,'this is the user details')
            const jobInfo = {
                title: data.jobTitle,
                description: data.jobDescription,
                skillsRequired: data.skills,
                budget: data.budget, 
                category: data.category,
                duration:data.duration,
                projectType:data.projectType,
                createdBy:user?._id,
               
            }
            const create = await UserRepository.createJob(jobInfo)
            console.log(create,'this is the created job we got in the service')
            if (create) {
                return {bool: true, data: create}
            } else {
                return {bool: false}
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

    userChangePasswordService = async (formData: any, _id: string) => {
        try {
            console.log(_id,'its here')
            console.log(formData,'this is the form data')
            // let { currentPassword, newPassword, confirmPassword } = value
            const userData = await UserRepository.getUserInfo(_id)
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
            const updatedData = await UserRepository.userChangePassword(hashPassword, _id)
            return updatedData
        } catch(error: any) {
            console.log(error.message)
            throw new Error(error.message)
        }
    }

    googleSignupService = async(name:string, email:string, password:string)=>{
        try {
            const existUser = await UserRepository.findByEmail(email)
            if(existUser){
                return{
                    status:200,
                    data:false
                }
            }else{
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
            console.log(error)
        }
    }

    getProposalServices = async(id: string)=>{
        try {
            const proposalData = await UserRepository.getProposals(id)
            if(proposalData){
                const freelancerId = proposalData.map((proposal)=>proposal.freelancerId)
                const freelancers = await UserRepository.getFreelancers(freelancerId)
                const proposals = await Promise.all(proposalData.map(async(proposal)=>{
                    const freelancer = freelancers?.find(f=>f._id.toString() === proposal.freelancerId.toString())
                    let photoUrl = null;
                    if(freelancer?.photo?.fileurl){
                        photoUrl = await aws.getFile('freelancerApplication/photo',freelancer.photo.fileurl)
                    }
                    return {
                        ...proposal,
                        freelancer:{...freelancer, photo:photoUrl}
                    }
                }))
                return proposals
            }else{
                throw new Error('No data have been found for this job')
            }
        } catch (error) {
            console.log(error)
        }
    }

    approveProposalService = async(id: string, status: 'rejected' | 'approved')=>{
        try {
            const updatedData = await UserRepository.approveProposal(id, status)
            return updatedData
        } catch (error) {
            console.log('an error has been occured',error)
        }
    }

    sendJobOfferService = async(offerData: any, freelancerId: string, jobId: string, userId: string )=>{
        try {
            console.log(offerData,'sdfghjkl', jobId,'..............', freelancerId, '========')
            const result = await UserRepository.getJobOffer(offerData,jobId, freelancerId, userId)
            if(result?.success == false){
                return false
            }else{
                return true
            }
        } catch (error) {
            console.log(error)
        }
    }

    getContractService = async(id: string)=>{
        try {
            const contract = await UserRepository.getContracts(id)
            if(!contract){
                throw AppError.notFound('No data have been found with the user')
            }else{
                return contract
            }
        } catch (error: any) {
            if(error instanceof AppError){
                throw error
            }
            throw new AppError('ContractDetailsFailed',
                500,
                error.message || 'An unexpected error occured'
            )
        }
    }

    signContractService = async(hash: string, contractId: ObjectId, userId: ObjectId)=>{
        try {
            const contract = await UserRepository.getContractDetails(userId, contractId)
            if(!contract){
                throw AppError.notFound('No contract have been foud with this freelancer')
            }
            if(contract.contractHash !== hash){
                throw AppError.conflict('Invalid Contract')
            }
            if(!contract.signedByFreelancer.signed){
                throw AppError.conflict('Freelancer yet have to sign the Contract')
            }else{
                const { publicKey, privateKey} = generateKeyPair()
                console.log(publicKey,privateKey,'these are the keys')
                const signature = signWithPrivateKey(hash, privateKey)
                console.log(signature,'this is the signature')

                contract.signedByClient = {
                    signed: true,
                    signedAt: new Date(),
                    publicKey,
                    signature
                }
                if (contract.signedByClient.signed && contract.signedByFreelancer.signed) {
                    contract.status = 'initial_payment'; 
                }
                await contract.save()
    
                return {
                    success: true,
                    privateKey,
                    signature
                }
            }

        } catch (error: any) {
            if(error instanceof AppError){
                throw error
            }
            throw new AppError('FailedSigningConract',
                500,
                error.message || 'An unexpected error occured'
            )
        }
    }

    createCheckoutSessionService = async(id: ObjectId, firstPayment: number, lastPayment: number)=>{
        try {
            console.log(id, firstPayment, lastPayment,'these are the data we got in the backend')
            const contract = await UserRepository.getSingleContract(id)
            if(!contract){
                throw AppError.notFound('Contract not found')
            }
                let lineItems
                if(contract!.status == 'initial_payment'){
                    lineItems = [
                        {
                            price_data: {
                                currency: 'INR',
                                product_data: {
                                    name: `Initial Payment for Contract ID: ${contract!._id}`,
                                },
                                unit_amount: firstPayment * 100,
                            },
                            quantity: 1,
                        },
                    ];
                }
                if(contract!.status == 'submitted'){
                    lineItems = [
                        {
                            price_data: {
                                currency: 'INR',
                                product_data: {
                                    name: `Final Payment for Contract ID: ${contract!._id}`,
                                },
                                unit_amount: lastPayment * 100,
                            },
                            quantity: 1,
                        },
                    ];
                }
            console.log(lineItems,'LineItems to be go to the checkout')
        
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.SERVER_URL}/confirmpayment`,
                cancel_url: `${process.env.CLIENT_URL}/failed`,
                metadata:{
                    contractId:contract._id?contract._id.toString(): 'unknown'
                },
            })
            if(contract._id){
                this.contractId = id
            }
            return session
        } catch (error: any) {
            if(error instanceof AppError){
                throw error
            }
            throw new AppError('FailedCreatingCheckout',
                500,
                error.message || 'An error has been occured'
            )
        }
    }

    confirmPaymentService = async()=>{
        try {
           const id: any = this.contractId
           console.log(id,'yeah we got the id') 
           const contract = await UserRepository.getSingleContract(id)
           if(!contract){
            throw AppError.notFound('Contract not found')
           }
           if(contract.status == 'initial_payment'){
            contract.status = 'active'
           contract.paymentStatus = 'partially_paid'
           await contract.save()
           this.contractId = null
           }else if(contract.status == 'submitted'){
            contract.status = 'completed'
           contract.paymentStatus = 'paid'
           await contract.save()
           this.contractId = null
           }
           
           return contract
        } catch (error: any) {
            if(error instanceof AppError){
                throw error
            }
            throw new AppError('PaymentConfirmationFailed',
                500,
                error.message || 'Unexpected Error'
            )
        }
    }

}