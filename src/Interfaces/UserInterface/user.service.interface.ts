import { ObjectId } from "mongoose";
import { ICategory, IContract, IFreelancer, INotification, IProposal, IReview, ISkill } from "../common.interface";
import IJob, { IAddress, ICleanedUser, IUser } from "../common.interface";

export default interface IUserService {
    register(userData:IUser):Promise<void>;
    verifyOtp(email:string, otp:string):Promise<Boolean>
    login(email: string, password: string):Promise<{userInfo: ICleanedUser,accessToken: string, refreshToken: string} >
    resendOtp():Promise<void>;
    verifyEmailAndSendOTP(email: string):Promise<{email: string, bool: boolean}>
    verifyForgotOtp(otp: string):Promise<Boolean>
    changePassword(password: string):Promise<any>
    createJobService(data:IJob, id: string): Promise<{bool: Boolean, data?:IJob}>
    addAddressService(data: IAddress, id: string):Promise<Boolean>
    getUserService(id: string):Promise<IUser>
    getFreelancerInfoService(userId: any , page: any, limit: any):Promise<{freelancerData:any[], totalPage:number | undefined}>
    userChangePasswordService(formData:any, _id: string):Promise<IUser>
    googleSignupService(name: string, email: string, password: string): Promise<{status: number, data: boolean} | {status: number, data: IUser} | undefined>
    getUserJobService(id: any, page: any, limit: any): Promise<{jobData:IJob[],totalPages:number}>
    getCategoryService():Promise<ICategory[]>
    getProposalServices(id: string):Promise<any>
    approveProposalService(id: string, status: 'rejected' | 'approved'):Promise<IProposal | null | undefined>
    sendJobOfferService(offerData: any, freelancerId: string, jobId: string, userId: string): Promise<Boolean | undefined>
    getContractService(id: string):Promise<IContract[] | null>
    signContractService(hash: string,contractId: ObjectId, userId:ObjectId):Promise<{success: Boolean | undefined, privateKey: string, signature: string}>
    createCheckoutSessionService(id: ObjectId, firstPayment: number, lastPayment: number):Promise<any>
    confirmPaymentService(sessionId: string):Promise<IContract>
    getNotificationService(id: string):Promise<INotification[]>
    changeNotificationStatusService(id: string, type: 'proposal' | 'message' | 'offer' | 'contract'):Promise<INotification[] | undefined>
    viewMessageNotificationService(userId: string, otherId: string):Promise<INotification[]>
    getWorkHistoryService(id: string):Promise<any>
    addRatingAndReviewService(data:{rating: number, review: string, userId: string, freelancerId: string}):Promise<any>
    getReviewsService(id:string):Promise<IReview[] | undefined>
    getTransactionService(userId: string):Promise<any>
    getSkillService():Promise<ISkill[]>
    getSingleContractService(id: any):Promise<IContract>
    updateProfileService(name: string, phone: string, id: string):Promise<IUser>
}