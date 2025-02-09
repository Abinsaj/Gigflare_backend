import { ObjectId } from "mongoose"
import IJob, { IContract, IFreelancer, IJobOffer, INotification, IProposal, IReview, ISkill } from "../common.interface"

export default interface IFreelancerService{
    freelancerApplicationService(files: any, data: any, userId: string):Promise<void>
    getSingleDetailService(id: string): Promise<any>
    getJobsService(id: string):Promise<IJob[]>
    updateProfileService(id: string, data: any): Promise<IFreelancer>
    createProposalService(data: any, userId: string, jobId: string, freelancerId: string):Promise<IProposal>
    getProposalsService(id: string): Promise<IProposal[]>
    getJobOfferDataService(id: string):Promise<IJobOffer[]>
    acceptOfferService(data: any):Promise<IContract | undefined>
    getContractService(id: string): Promise<IContract[]>
    signContractService(hash: string, contractId: ObjectId, freelancerId: ObjectId):Promise<{success: boolean, privateKey: string, signature: string}>
    changeStatusService(id: any, status: "submitted" | 'termination_requested'):Promise<IContract>
    deleteProposalService(id: string): Promise<any>
    getFreelancerNotificationService(id: string): Promise<INotification[]>
    getWorkHistoryService(id: string): Promise<IContract[]>
    getSkillsService(id: string): Promise<ISkill[]>
    getFilteredJobService(filter: any): Promise<IJob[]>
    getDashboardDataService(id: string): Promise<any>
    getReviews(id: string): Promise<IReview[]>
}