import { AwsConfig } from "../Config/awsFileConfig"
import { v4 as uuidv4 } from "uuid";
import { FreelancerRepository } from "../Repository/freelancerRepository";
import { AnyArray, ObjectId } from "mongoose";
import AppError from "../utils/AppError";
import { IContract } from "../Interfaces/common.interface";
import * as crypto from 'crypto'
import generateKeyPair from "../utils/GenerateKeyPair";
import signWithPrivateKey from "../utils/Signature";
import { UserRepository } from "../Repository/userRepository";
import NotificationModel from "../Models/notificationSchema";
import { getRecieverSocketId, io } from "../server";
import { AdminRepository } from "../Repository/adminRepository";
import SkillSchema from "../Models/skillSchema";
import  IFreelancerService  from "../Interfaces/FreelancerInterface/freelancer.service.interface";
import { IFreelancerRepository } from "../Interfaces/FreelancerInterface/freelancer.repository.interface";
import IUserRepository from "../Interfaces/UserInterface/user.repository.interface";


require('dotenv').config();

export class FreelancerService implements IFreelancerService {

    private awsConfig = new AwsConfig()
    private freelancerRepository: IFreelancerRepository
    private userRepository: IUserRepository

    constructor(
        freelancerRepository: IFreelancerRepository,
        userRepository: IUserRepository
    ){
        this.freelancerRepository = freelancerRepository
        this.userRepository = userRepository
    }


    freelancerApplicationService = async (files: any, data: any, userId: string): Promise<void> => {
        try {
            const bucketName = process.env.BUCKET_NAME
            const fileUrls: { type: string; url: string }[] = [];
            let photoUrl
            if (files.photo) {
                photoUrl = await this.awsConfig.uploadFile(
                    'freelancerApplication/photo/',
                    files.photo[0]
                );
            }

            let certficateUrl = []
            if (files.certification) {
                for (const certificate of files.certification) {
                    let certficate = await this.awsConfig.uploadFile(
                        'freelancerApplication/certification/',
                        certificate
                    );
                    certficateUrl.push(certficate)
                }
            }
            let skill = []
            for(let val of data.skills){
                let skills: any = await SkillSchema.findOne({name: val})
                skill.push(skills._id)
            }
            const category = await this.freelancerRepository.getSingleCategory(data.experience.expertise)
            const experience = {
                categoryId: category!._id,
                expertise: data.experience.expertise,
                fromYear: data.experience.fromYear,
                toYear: data.experience.toYear,
                
            }
            let photo = {
                fileurl: photoUrl
            }
            data.photo = photo
            data.certficatImage = certficateUrl
            data.experience = experience
            data.skills = skill
            const applicationId = uuidv4()

            const appData = {
                userId,
                applicationId,
                ...data
            };

            const freelancerData = await this.freelancerRepository.saveApplication(appData as any)
            if (!freelancerData) {
                throw AppError.conflict('Failed to save freelancer application');
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('Application Error', 500, error.message || 'An error occured while processing the application');
        }
    }

    updateProfileService = async(id: string, data: any  )=>{
        try {
            const bucketName =  process.env.BUCKET_NAME
            
            if (data.photo) {
                let photoUrl = await this.awsConfig.uploadFile(
                    'freelancerApplication/photo/',
                    data.photo
                );
                data.photo = { fileurl: photoUrl }
            }else {
                delete data.photo; 
            }

            let skills = []
            for(let val of data.skills){
                let skill: any = await SkillSchema.findOne({name: val})
                skills.push(skill!._id)
            }

            data.skills = skills

            const freelancerData = await this.freelancerRepository.updateFreelancerProfile(id, data)
            if(!freelancerData){
                throw AppError.conflict('Profile updation failed')
            }
            return freelancerData
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('Application Error', 500, error.message || 'An error occured while updting the profile ');
        }
    }

    getSingleDetailService = async (id: string) => {
        try {
            const data = await this.freelancerRepository.getFreelancerDetail(id)
            if (!data) {
                throw AppError.notFound('No data have been found')
            }
            const image = await this.awsConfig.getFile('freelancerApplication/photo', data?.photo?.fileurl)
            let certificateImg = ''
            for (let image of data?.certficatImage!) {
                certificateImg = await this.awsConfig.getFile('freelancerApplication/certification', image)
            }

            const freelancerData = {
                _id: data._id,
                userId: data!.userId,
                applicationId: data!.applicationId,
                firstName: data!.firstName,
                lastName: data!.lastName,
                profile: image,
                description: data!.description,
                language: data!.language,
                experience: data!.experience,
                skills: data!.skills,
                education: data!.education,
                certification: data!.certification,
                certificateImage: certificateImg,
                portfolio: data!.portfolio,
                email: data!.email,
                phone: data!.phone
            }
            return freelancerData
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('DetailRetrievalError', 500, error.message || 'Failed to retrieve freelancer details')
        }
    }

    getJobsService = async(id: string)=>{
        try {
            const data = await this.freelancerRepository.getJobs(id)
            if(!data){
                throw AppError.notFound('No data have been found')
            }
            return data
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('DetailRetrievalError', 500, error.message || 'Failed to retrieve job details')
        }
    }

    createProposalService = async (data: any, userId: string, jobId: string, freelancerId: string) => {
        try {
            const jobData = await this.freelancerRepository.getSingleJobData(jobId)
            if (jobData) {
                const proposals: any = await this.freelancerRepository.getProposals(freelancerId)
                const isProposalExist = proposals.some((proposal: any) =>
                    jobData.proposals?.includes(proposal._id))
                if (!isProposalExist) {
                    if (jobData.status == 'open') {
                        const proposalData = {
                            jobId: jobId,
                            userId: userId,
                            freelancerId: freelancerId,
                            coverLetter: data.coverLetter,
                            timeLine: data.timeLine,
                            totalBudget: parseFloat(data.totalBudget) || 0
                        }
                        const createProposal = await this.freelancerRepository.createJobProposal(proposalData)

                        const proposalId = createProposal._id as ObjectId
                        jobData.proposals?.push(freelancerId as unknown as ObjectId)
                        await jobData.save()

                        const proposalNotification = await NotificationModel.create({
                            userId: jobData.createdBy,
                            type: 'proposal',
                            message: `New proposal for the job ${jobData.title}`,
                            data:{
                                freelancerId: freelancerId,
                                letter: createProposal.coverLetter,
                                jobId: jobData._id
                            },
                        })

                        const recieverSocketId = getRecieverSocketId(jobData.createdBy)

                        if(recieverSocketId){
                            io.to(recieverSocketId).emit('notifications',proposalNotification)
                            io.to(recieverSocketId).emit('proposal', proposalNotification)
                        }

                        return createProposal
                    } else {
                        throw ('Proposal have been closed')
                    }
                } else {
                    throw new Error('You have already send a proposal')
                }
            } else {
                throw new Error('You have already send a proposal')
            }
        } catch (error: any) {
            console.log(error)
            throw new Error(error.message)
        }
    }

    getProposalsService = async (id: string) => {
        try {
            const proposals = await this.freelancerRepository.getProposals(id)
            return proposals
        } catch (error: any) {
            console.log(error)
            throw new Error(error)
        }
    }

    getJobOfferDataService = async(id: string)=>{
        try {
            const job = await this.freelancerRepository.getJobOfferData(id)
            if(!job){
                throw AppError.notFound('No data have been found')
            }
            return job
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('Application Error', 500, error.message || 'An error occured ');
        }
    }

    acceptOfferService = async (data: any) => {
        try {
            if (data.termsAccepted == true) {
                const offer = await this.freelancerRepository.changeOfferStatus(data)
                if (offer) {
                    if (offer.status == 'accepted') {
                        const contract = {
                            freelancerId: offer.freelancerId,
                            clientId: offer.clientId,
                            jobId: offer.jobId,
                            offerId: offer?._id,
                            totalBudget: data.budget,
                            startDate: data.fromDate,
                            endDate: data.toDate,
                            initialPayment: data.upfrontAmount,
                            remainingPayment: data.restAmount,
                            platformFee: data.platformFee,
                            totalEarnings: data.budget - data.platformFee,
                            terms: data.termsAndConditions,
                            termsAccepted: data.termsAccepted,
                            
                        }
                        let job_id: any = offer.jobId
                        const job = await this.freelancerRepository.getSingleJobData(job_id)

                        if (job) {
                            job.status = 'closed';
                            await job.save();
                        } else {
                            throw new AppError('JobNotFound', 404, 'Job not found to update its status');
                        }

                        const contractString = JSON.stringify(contract);
                        const contractHash = crypto
                        .createHash('sha256')
                        .update(contractString)
                        .digest('hex')


                        // const newContract = new ContractSchema({
                        //     ...contract,
                        //     contractHash
                        // });
                        const datas = {
                            ...contract,
                            contractHash
                        }

                        const newContract = await this.freelancerRepository.createContract(datas)

                        

                        // await newContract.save();
    
                        return newContract;
                    }
                }
            }else{
                throw AppError.conflict('Terms must be accepted to proceed')
            }
        } catch (error: any) {
            if(error instanceof AppError){
                throw error
            }
            throw new AppError('AcceptOfferCreateContractError',
                500,
                error.message || 'An unexpected error occured'
            )
        }
    }

    getContractService = async(id: string)=>{
        try {
            const contract = await this.freelancerRepository.getContracts(id)
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

    signContractService = async(hash: string, contractId: ObjectId, freelancerId: ObjectId)=>{
        try {
            const contract: any = await this.freelancerRepository.getContractDetails(freelancerId, contractId)
            if(!contract){
                throw AppError.notFound('No contract have been foud with this freelancer')
            }
            if(contract.contractHash !== hash){
                throw AppError.conflict('Invalid Contract')
            }
            if(contract.signedByFreelancer.signed){
                throw AppError.conflict('Already signed by the freelancer')
            }

            const { publicKey, privateKey} = generateKeyPair()

            const signature = signWithPrivateKey(hash, privateKey)
            
            contract.signedByFreelancer = {
                signed: true,
                signedAt: new Date(),
                publicKey,
                signature
            }

            await contract.save()

            return {
                success: true,
                privateKey,
                signature
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

    changeStatusService = async (id: any, status: "submitted" | 'termination_requested') => {
        try {
            const contract = await this.userRepository.getSingleContract(id);
            if (!contract) {
                throw AppError.notFound('Contract not found');
            }
            if (contract.status === 'completed' || contract.status === 'terminated') {
                throw AppError.conflict('Cannot change the status');
            }
    
            if (contract.status !== status) {
                contract.status = status;
                await contract.save();
                return contract;
            } else {
                throw AppError.conflict('Cannot change the status');
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(
                'FailedStatusChanging',
                500,
                error.message || 'An unexpected error occurred'
            );
        }
    };

    deleteProposalService = async(id: string)=>{
        try {
            const proposal = await this.freelancerRepository.deleteProposal(id)
            return proposal
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(
                'FailedToDeleteProposal',
                500,
                error.message || 'An unexpected error occurred'
            );
        }
    }

    getFreelancerNotificationService = async(id: string)=>{
        try {
            const notification = await this.freelancerRepository.getFreelancerNotification(id)
            if(!notification){
                throw AppError.notFound('No notification have been found')
            }
            return notification
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(
                'FailedToGetNotification',
                500,
                error.message || 'An unexpected error occurred'
            );
        }
    }

    getWorkHistoryService = async(id: string)=>{
        try {
            const workHistroy = await this.freelancerRepository.getWorkHistory(id)
            
            return workHistroy
        } catch (error: any) {
            throw new AppError(
                'Failed getting History',
                500,
                error.message || 'An unexpected error occurred'
            );
        }
    }

    getSkillsService = async(id: string)=>{
        try {
            const data = await this.freelancerRepository.getSkills(id)
            if(!data){
                throw AppError.notFound('No data have been found')
            }
            return data
        } catch (error: any) {
            throw new AppError(
                'Failed getting Skills',
                500,
                error.message || 'An unexpected error occurred'
            );
        }
    }

    getFilteredJobService = async(filter: any)=>{
        try {
            const data = await this.freelancerRepository.getFilteredJob(filter)
            if(!data){
                throw AppError.notFound('Data not found')
            }
            return data
        } catch (error: any) {
            throw new AppError(
                'Failed to get filtered data',
                500,
                error.message || 'An unexpected error occurred'
            );
        }
    }
    
    getDashboardDataService = async(id: string)=>{
        try {
            const contracts = await this.freelancerRepository.getContracts(id)
            if(!contracts){
                throw AppError.notFound('No contract have been found for this freelancer')
            }
            const projects = contracts.filter((contract: any)=>contract.status == 'completed')
            const totalProject = projects.length
            const earnings = projects.reduce((sum,contract)=> sum + contract.totalEarnings, 0)
            const activeContract = contracts.filter((contract)=> contract.status == 'active' || contract.status == 'submitted' || contract.status == 'initial_payment').length
            
            const recentProjects = await this.freelancerRepository.getRecentContracts(id )
            const ratingReview = await this.freelancerRepository.getReviewRating(id)

            return {
                earnings,
                totalProject,
                activeContract,
                recentProjects,
                ratingReview
            }

        } catch (error: any) {
            if(error instanceof AppError){
                throw error
            }else{
                throw new AppError(
                    'Failed getting dashboard history',
                    500,
                    error.message || 'An unexpected error occurred'
                );
            }

        }
    }

    getReviews = async(id: string)=>{
        try {
            const review = await this.freelancerRepository.getReviewRating(id)
            if(!review){
                throw AppError.notFound('No data have been found')
            }
            return review
        } catch (error: any) {
            if(error instanceof AppError){
                throw error
            }else{
                throw new AppError(
                    'Failed get rating and review',
                    500,
                    error.message || 'An unexpected error occurred'
                );
            }
        }
    }

}