import IJob, { IAddress, ICleanedUser, IFreelancer, IUser } from "../Interfaces/common.interface"
import { UserRepository } from "../Repository/userRepository"
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from "uuid"
import sendOTPMail from "../Config/emailConfig"
import { createRefreshToken, createToken } from "../Config/jwtConfig"
import address from "../Models/userSchema"
import { AwsConfig } from "../Config/awsFileConfig"
import AppError from "../utils/AppError"
import { ObjectId } from "mongoose"
import generateKeyPair from "../utils/GenerateKeyPair"
import signWithPrivateKey from "../utils/Signature"
import Stripe from "stripe"
import SkillSchema from "../Models/skillSchema"
import IUserRepository from "../Interfaces/UserInterface/user.repository.interface"
import IUserService from "../Interfaces/UserInterface/user.service.interface"

require('dotenv').config()


const aws = new AwsConfig()
const stripe = new Stripe(process.env.STRIPE_SECRET! as string)

export class UserService implements IUserService{
    private userData: any | null = null
    private OTP: string | null = null
    private expiryOTP_time: Date | null = null
    private email: string | null = null
    private contractId: ObjectId | null = null
    private userRepository: IUserRepository

    constructor(
        userRepository: IUserRepository
    ) {
        this.userRepository = userRepository
    }

    register = async (userData: IUser): Promise<void> => {
        try {
            const existUser = await this.userRepository.existUser(userData.email)
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
                await this.userRepository.createUser(userData);
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
        userInfo: ICleanedUser,
        accessToken: string,
        refreshToken: string
    }> => {
        try {
            const userExist = await this.userRepository.verifyLogin(email, password)
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
                _id: userExist._id?.toString(),
                userId: userExist.userId,
                name: userExist.name,
                email: userExist.email,
                // phone: userExist.phone,
                isBlocked: userExist.isBlocked,
                createdAt: userExist.createdAt!.toISOString().slice(0, 10),
                isFreelancer: userExist.isFreelancer
            }
            const accessToken = createToken(userExist._id, "user");

            const refreshToken = createRefreshToken(userExist._id, "user");

            return { userInfo, accessToken, refreshToken };
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
            const emailExist = await this.userRepository.verifyEmail(email)
            if (!emailExist) {

                throw new Error('Email is not valid')

            } else {

                const generateOtp: string = Math.floor(100000 + Math.random() * 900000).toString()
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
            const user = await this.userRepository.changePassword(hashPassword, email)

            if (!user) {
                throw { statusCode: 404, message: ' User not found ' }
            }
            return user
        } catch (error: any) {
            throw { statusCode: error.statusCode || 500, message: error.message || 'Internal server Error' }
        }
    }

    createJobService = async (data: IJob, id: string) => {
        try {
            const user = await this.userRepository.getUserInfo(id)

            let skills = []
            for (let val of data.skillsRequired) {
                let skill = await SkillSchema.findOne({ name: val }) /////////////////////////////////////////////////////////
                skills.push(skill?._id)
            }

            const jobInfo = {
                title: data.title,
                description: data.description,
                skillsRequired: skills,
                budget: data.budget,
                category: data.category,
                duration: data.duration,
                projectType: data.projectType,
                createdBy: user?._id,

            }
            const create = await this.userRepository.createJob(jobInfo)
            if (create) {
                return { bool: true, data: create }
            } else {
                return { bool: false }
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    addAddressService = async (data: IAddress, id: string) => {
        try {
            const addressInfo = {
                address: data.address,
                country: data.country,
                state: data.state,
                city: data.city,
                pincode: data.pincode
            }
            const createData = await this.userRepository.addAddress(addressInfo, id)
            return true
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getUserService = async (id: string) => {
        try {
            const data = await this.userRepository.getUserInfo(id)
            if (!data) {
                throw new Error('No data have found')
            }
            return data
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    // getFreelancerInfoService = async (userId?: any , page?: any, limit?: any) => {
    //     try {
    //         let result: any = []
    //         if(userId && page && limit){
    //              result = await this.userRepository.getFreelancerDetails(userId, page, limit)
    //              let image = ''
    //              let freelancerData = []
    //              for (let data of result.data) {
    //                  image = (await aws.getFile('freelancerApplication/photo', data.photo?.fileurl))
    //                  const updatedData = {
    //                      _id: data._id,
    //                      userId: data.userId,
    //                      applicationId: data.applicationId,
    //                      firstName: data.firstName,
    //                      lastName: data.lastName,
    //                      profile: image,
    //                      description: data.description,
    //                      language: data.language,
    //                      experience: data.experience,
    //                      skills: data.skills,
    //                      education: data.education,
    //                      certification: data.certification,
    //                      portfolio: data.portfolio,
    //                      email: data.email,
    //                      phone: data.phone,
    //                      createdAt: data.createdAt
    //                  }
    //                  freelancerData.push(updatedData)
    //              }

    //              return { freelancerData, totalPage:result.totalPages }
    //         }else{
    //             result = await this.userRepository.getFreelancersList(userId)
    //             let image = ''
    //              let freelancerData = []
    //              for (let data of result) {
    //                  image = (await aws.getFile('freelancerApplication/photo', data.photo?.fileurl))
    //                  const updatedData = {
    //                      _id: data._id,
    //                      userId: data.userId,
    //                      applicationId: data.applicationId,
    //                      firstName: data.firstName,
    //                      lastName: data.lastName,
    //                      profile: image,
    //                      description: data.description,
    //                      language: data.language,
    //                      experience: data.experience,
    //                      skills: data.skills,
    //                      education: data.education,
    //                      certification: data.certification,
    //                      portfolio: data.portfolio,
    //                      email: data.email,
    //                      phone: data.phone,
    //                      createdAt: data.createdAt
    //                  }
    //                  freelancerData.push(updatedData)
    //              }

    //              return {freelancerData}
    //         }
    //     } catch (error: any) {
    //         throw new Error(error.message)
    //     }
    // }

    getFreelancerInfoService = async (userId?: string, page?: number, limit?: number): Promise<{ freelancerData: any[]; totalPage: number | undefined }> => {
        try {
            let freelancerData = [];
            let result: { data?: any[]; totalPages?: number } = {};

            if (userId && page && limit) {
                result = await this.userRepository.getFreelancerDetails(userId, page, limit);
            } else if (userId) {
                result.data = await this.userRepository.getFreelancersList(userId);
            } else {
                throw new Error('Invalid parameters: userId is required');
            }

            for (let data of result.data || []) {
                const image = await aws.getFile('freelancerApplication/photo', data.photo?.fileurl || '');
                freelancerData.push({
                    _id: data._id,
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
                    phone: data.phone,
                    createdAt: data.createdAt,

                });
            }

            return {
                freelancerData,
                totalPage: result.totalPages || undefined,
            };
        } catch (error: any) {
            throw new Error(error.message || 'An unexpected error occurred');
        }
    };


    userChangePasswordService = async (formData: any, _id: string) => {
        try {
            // let { currentPassword, newPassword, confirmPassword } = value
            const userData = await this.userRepository.getUserInfo(_id)
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
            if (formData.newPassword !== formData.confirmPassword) {
                throw new Error('both password should be same')
            }
            const hashPassword = await bcrypt.hash(formData.newPassword, 10)
            const updatedData = await this.userRepository.userChangePassword(hashPassword, _id)
            return updatedData
        } catch (error: any) {
            console.log(error.message)
            throw new Error(error.message)
        }
    }

    googleSignupService = async (name: string, email: string, password: string) => {
        try {
            const existUser = await this.userRepository.existUser(email)
            if (existUser) {
                return {
                    status: 200,
                    data: false
                }
            } else {
                if(existUser!.isBlocked == true){
                    throw AppError.unauthorized('User is blocked')
                }
                const userId = uuidv4()
                const saltRounds: number = 10;
                const hashPassword = await bcrypt.hash(password, saltRounds)
                const userSave = await this.userRepository.createUser({ userId, name, email, password: hashPassword } as IUser)
                return {
                    status: 200,
                    data: userSave
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    getUserJobService = async (id: any, page: any, limit: any) => {
        try {
            const jobs = await this.userRepository.getUserJob(id, page, limit)
            if (!jobs) {
                throw AppError.notFound('No job have been found for the user')
            }
            return jobs
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedCreatingCheckout',
                500,
                error.message || 'An error has been occured'
            )
        }
    }

    getCategoryService = async()=>{
        try {
            const category = await this.userRepository.getCategories()
            if(!category){
                throw AppError.notFound('No data have been found')
            }
            return category
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedFetchingCategory',
                500,
                error.message || 'An error has been occured'
            )
        }
    }

    getProposalServices = async (id: string):Promise<any> => {
        try {
            const proposalData = await this.userRepository.getProposals(id)
            if (proposalData) {
                
                const freelancerId = proposalData.map((proposal) => proposal.freelancerId)
                const reviews = await this.userRepository.getReviews(freelancerId)
                const freelancers = await this.userRepository.getFreelancers(freelancerId)
                const proposals = await Promise.all(proposalData.map(async (proposal) => {
                    const freelancer = freelancers?.find(f => f._id.toString() === proposal.freelancerId.toString())
                    let photoUrl = null;
                    if (freelancer?.photo?.fileurl) {
                        photoUrl = await aws.getFile('freelancerApplication/photo', freelancer.photo.fileurl)
                    }
                    return {
                        ...proposal,
                        freelancer: { ...freelancer, photo: photoUrl },
                        reviews
                    }
                }))
                return proposals
            } else {
                throw new Error('No data have been found for this job')
            }
        } catch (error) {
            console.log(error)
        }
    }

    approveProposalService = async (id: string, status: 'rejected' | 'approved') => {
        try {
            const updatedData = await this.userRepository.approveProposal(id, status)
            return updatedData
        } catch (error) {
            console.log('an error has been occured', error)
        }
    }
    sendJobOfferService = async (offerData: any, freelancerId: string, jobId: string, userId: string) => {
        try {
            console.log('its herererererererererekksadfolflad')
            if(offerData.attachmentPath){
                let attachment = await aws.uploadFile(
                    'attachment/photo/',
                    offerData.attachmentPath
                )
                offerData.attachment = attachment
            }

            const result = await this.userRepository.getJobOffer(offerData, jobId, freelancerId, userId)
            if (result?.success == false) {
                return false
            } else {
                return true
            }
        } catch (error) {
            console.log(error)
        }
    }

    getContractService = async (id: string) => {
        try {
            const contract = await this.userRepository.getContracts(id)
            if (!contract) {
                throw AppError.notFound('No data have been found with the user')
            } else {
                return contract
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('ContractDetailsFailed',
                500,
                error.message || 'An unexpected error occured'
            )
        }
    }

    signContractService = async (hash: string, contractId: ObjectId, userId: ObjectId) => {
        try {
            const contract = await this.userRepository.getContractDetails(userId, contractId)
            if (!contract) {
                throw AppError.notFound('No contract have been foud with this freelancer')
            }
            if (contract.contractHash !== hash) {
                throw AppError.conflict('Invalid Contract')
            }
            if (!contract.signedByFreelancer.signed) {
                throw AppError.conflict('Freelancer yet have to sign the Contract')
            } else {
                const { publicKey, privateKey } = generateKeyPair()
                const signature = signWithPrivateKey(hash, privateKey)

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
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedSigningConract',
                500,
                error.message || 'An unexpected error occured'
            )
        }
    }

    createCheckoutSessionService = async (id: ObjectId, firstPayment: number, lastPayment: number) => {
        try {
            const contract = await this.userRepository.getSingleContract(id)
            if (!contract) {
                throw AppError.notFound('Contract not found')
            }
            let lineItems
            if (contract!.status == 'initial_payment') {
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
            if (contract!.status == 'submitted') {
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

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.SERVER_URL}/confirmpayment?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.CLIENT_URL}/failed`,
                metadata: {
                    contractId: id.toString()
                },
            })
            return session
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedCreatingCheckout',
                500,
                error.message || 'An error has been occured'
            )
        }
    }

    confirmPaymentService = async (sessionId: string) => {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            const contractId: any = session.metadata!.contractId;
            if (!contractId) {
                throw AppError.badRequest('Contract ID not found in session metadata');
            }

            const contract = await this.userRepository.getSingleContract(contractId as ObjectId);
            if (!contract) {
                throw AppError.notFound('Contract not found');
            }

            if (contract.status === 'initial_payment') {
                contract.status = 'active';
                contract.paymentStatus = 'partially_paid';
            } else if (contract.status === 'submitted') {
                contract.status = 'completed';
                contract.paymentStatus = 'paid';
            }

            await contract.save();
            return contract;
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('PaymentConfirmationFailed',
                500,
                error.message || 'Unexpected Error'
            )
        }
    }

    getNotificationService = async(id: string)=>{
        try {
            const data = await this.userRepository.getNotification(id)
            if(!data){
                throw AppError.notFound('No data have been found')
            }
            return data
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FetchNotificationDataFailed',
                500,
                error.message || 'Unexpected Error'
            )
        }
    }

    changeNotificationStatusService = async(id: string, type: 'proposal' | 'message' | 'offer' | 'contract')=>{
        try {
            const notification = await this.userRepository.changeNotificationStatus(id, type)
            if(!notification){
                throw AppError.notFound('No data have been found')
            }
            return notification
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('ErrorFetchingNotification',
                500,
                error.message || 'Unexpected Error'
            )
        }
    }

    viewMessageNotificationService = async(userId: string, otherId: string)=>{
        try {
            const notification = await this.userRepository.messageNotificationChange(userId,otherId)
            if(!notification){
                throw AppError.notFound('Notification not found')
            }
            return notification
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('ErrorFetchingNotification',
                500,
                error.message || 'Unexpected Error'
            )
        }
    }

    getWorkHistoryService = async (id: string) => {
        try {
            const history = await this.userRepository.getWorkHistory(id)
            if (history) {
                const freelancerId = history.map((data) => data.freelancerId)
                const freelancers = await this.userRepository.getFreelancers(freelancerId)
                const histories = await Promise.all(history.map(async (data) => {
                    const freelancer = freelancers?.find(f => f._id.toString() === data.freelancerId.toString())
                    let photoUrl = null;
                    if (freelancer?.photo?.fileurl) {
                        photoUrl = await aws.getFile('freelancerApplication/photo', freelancer.photo.fileurl)
                    }
                    return {
                        ...data,
                        freelancer: { ...freelancer, photo: photoUrl }
                    }
                }))
                return histories
            } else {
                throw AppError.notFound('No data have found')
            }
        } catch (error: any) {
            throw new AppError('FailedFetchingHistroy',
                500,
                error.message || 'Unexpected Error'
            )
        }
    }

    addRatingAndReviewService = async (data: { rating: number, review: string, userId: string, freelancerId: string }) => {
        try {
            const contract = await this.userRepository.checkContract(data.userId, data.freelancerId)

            if (contract!.length > 0) {
                let contractValid = contract!.filter((val: any) => val.status !== 'draft')
                if (contractValid) {
                    const ratingReview = {
                        clientId: data.userId,
                        freelancerId: data.freelancerId,
                        rating: data.rating,
                        review: data.review
                    }
                    const updateRatingReview = await this.userRepository.addRatingAndReview(ratingReview)
                    const userInfo = await this.userRepository.getUserInfo(data.userId)
                    const details = {
                        clientId: userInfo,
                        freelancerId: updateRatingReview.freelancerId,
                        rating: updateRatingReview.rating,
                        review: updateRatingReview.review

                    }
                    if (updateRatingReview) {
                        return details
                    }
                } else {
                    throw AppError.notFound('You dont have an active contract with the freelancer')
                }
            } else {
                throw AppError.notFound('You dont have a contract with the freelancer')
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('FailedToSaveReview',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }

    getReviewsService = async(id: string)=>{
        try {
            const data = await this.userRepository.getReviews(id)
            if(!data){
                throw AppError.notFound("No data have been found")
            }
            return data
        } catch (error) {
            
        }
    }

    getTransactionService = async (userId: string) => {
        try {
            const contracts: any = await this.userRepository.getContracts(userId)
            const transactions = [];
            if(!contracts){
                throw AppError.notFound('No contract have been found')
            }
            const allSessions = await stripe.checkout.sessions.list({ limit: 100 });
            for (const contract of contracts) {
                const contractId = contract._id.toString();

                const matchingSessions = allSessions.data.filter(
                    (session) => session.metadata?.contractId === contractId
                );

                for (const session of matchingSessions) {
                    const paymentIntentId = session.payment_intent;
                    if (typeof paymentIntentId === 'string') {
                        const paymentIntentResponse = await stripe.paymentIntents.retrieve(paymentIntentId);
                        const latestChargeId: any = paymentIntentResponse.latest_charge;

                        let paymentMethodDetails: Stripe.Charge.PaymentMethodDetails | null = null;
                        let chargeDetails: Stripe.Charge | null = null;
                        let receiptUrl: string | null = null
                        if (latestChargeId) {
                            chargeDetails = await stripe.charges.retrieve(latestChargeId);
                            paymentMethodDetails = chargeDetails.payment_method_details;
                            receiptUrl = chargeDetails.receipt_url
                        }

                        const amountInRupees = paymentIntentResponse.amount / 100

                        const formattedDate = new Date(session.created * 1000).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                        });

                        transactions.push({
                            contractId,
                            freelancer: contract.freelancerId.firstName+contract.freelancerId.lastName,
                            client: contract.clientId.name,
                            sessionId: session.id,
                            amount: amountInRupees,
                            currency: paymentIntentResponse.currency,
                            status: paymentIntentResponse.status,
                            created: formattedDate,
                            transactionId: chargeDetails?.id,
                            receiptUrl: receiptUrl,
                            paymentMethod: paymentMethodDetails,
                        });
                    } else {
                        console.warn(`Invalid paymentIntentId for session ${session.id}: ${paymentIntentId}`);
                    }
                }
            }
            return transactions
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('FailedToGetTransactions ',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }

    getSkillService = async()=>{
        try {
            const skill = await this.userRepository.getSkills()
            if(!skill){
                throw AppError.notFound('No data have been found')
            }
            return skill
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('FailedToGetSkills ',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }

    getSingleContractService = async(id: any)=>{
        try {
            const contract = await this.userRepository.getSingleContract(id)
            if(!contract){
                throw AppError.notFound('No data have been found')
            }
            return contract
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('Failed to get contract ',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }

    updateProfileService = async (name: string, phone: string, id: string) => {
        try {

            const userInfo = await this.userRepository.getUserInfo(id);
            if (userInfo) {

                userInfo.name = name;
                userInfo.phone = phone;


                const updatedUser = await this.userRepository.updateUserInfo(id, userInfo); 
                if (updatedUser) {
                    return updatedUser;
                } else {
                    throw new Error('Failed to update user information');
                }
            } else {
                throw new Error('User not found');
            }
        } catch (error: any) {
            console.error(error);
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('FailedToGetTransactions ',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    };

}