import { ICategory, IContract, IFreelancer, INotification, IProposal, IReview, ISkill } from "../common.interface";
import IJob, { IUser } from "../common.interface";
import { ObjectId } from "mongoose";

export default interface IUserRepository{
    existUser(email: string):Promise<IUser | null>
    createUser(userData:IUser):Promise<IUser>
    verifyLogin(email: string, password: string):Promise<IUser | null>
    verifyEmail(email: string):Promise<Boolean>
    changePassword(password: string, email: string):Promise<IUser>
    getUserInfo(_id: string):Promise<IUser | null>
    createJob(data: any):Promise<IJob>
    addAddress(data: any, id: any):Promise<IUser | null>
    getFreelancerDetails(id: string, page: number, limit: number):Promise<{data: IFreelancer[], totalPages: number}>
    getFreelancersList(id: string | undefined):Promise<IFreelancer[]>
    userChangePassword(password: string, _id: string):Promise<IUser>
    getUserJob(_id: any, page: any, limit: any):Promise<{jobData: IJob[], totalPages:number} >
    getCategories():Promise<ICategory[]| undefined>
    getProposals(jobId: string):Promise<IProposal[] | undefined>
    getFreelancers(id:ObjectId[]):Promise<IFreelancer[] | undefined>
    approveProposal(id: string, status: 'rejected' | 'approved'):Promise<IProposal | null>
    getJobOffer(offerData: any, jobId: string, freelancerId: string, userId: string):Promise<{success: Boolean}>
    getContracts(clientId: string):Promise<IContract[] | null>
    getContractDetails(userId: ObjectId, contractId: ObjectId): Promise<IContract>
    getSingleContract(id: ObjectId):Promise<IContract | null>
    getNotification(id: string):Promise<INotification[]>
    changeNotificationStatus(id: string, type: 'proposal' | 'message' | 'offer' | 'contract'): Promise<INotification[]| undefined>
    messageNotificationChange(sender: string, receiver: string):Promise<INotification[]>
    getWorkHistory(id: string):Promise<IContract[] | null>
    checkContract(userId: string, freelancerId: string):Promise<IContract[] | null>
    addRatingAndReview(data:{clientId: string, freelancerId: string, rating: Number, review: string}): Promise<IReview>
    getReviews(id: any):Promise<IReview[]>
    getSkills():Promise<ISkill[]>
    updateUserInfo(id: string, updatedData: any):Promise<IUser>
}