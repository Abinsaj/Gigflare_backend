import { ObjectId } from "mongoose";
import IJob, { ICategory, IContract, IFreelancer, IJobOffer, INotification, IProposal, IReview, ISkill } from "../common.interface";

export interface IFreelancerRepository{
    getSingleCategory(name: string):Promise<ICategory | undefined | null>
    saveApplication(data: any): Promise<IFreelancer>
    getFreelancerDetail(id: string):Promise<IFreelancer>
    getJobs(id: string):Promise<IJob[]>
    updateFreelancerProfile(id: string, data: any):Promise<IFreelancer | null>
    getSingleJobData(_id: string):Promise<IJob | null | undefined>
    getProposals(freelancerId: string):Promise<IProposal[]>
    createJobProposal(data: any):Promise<IProposal>
    getJobOfferData(id: string):Promise<IJobOffer[]>
    changeOfferStatus(data:any): Promise<IJobOffer>
    createContract(data: any):Promise<IContract>
    getContracts(freelancerId: string): Promise<IContract[]>
    getContractDetails(userId: ObjectId,contractId: ObjectId) :Promise<IContract>
    deleteProposal(id: string): Promise<any>
    getFreelancerNotification(id: string):Promise<INotification[]>
    getWorkHistory(id: string): Promise<IContract[]>
    getSkills(id: string): Promise<ISkill[]>
    getFilteredJob(filter: any): Promise<IJob[]>
    getRecentContracts(id: string):Promise<IContract[]>
    getReviewRating(id: string): Promise<IReview[]>
}