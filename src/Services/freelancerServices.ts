import { AwsConfig } from "../Config/awsFileConfig"
import { v4 as uuidv4 } from "uuid";
import { FreelancerRepository } from "../Repository/freelancerRepository";
import { ObjectId } from "mongoose";
import AppError from "../utils/AppError";
import ContractSchema, { IContract } from "../Models/contractSchema";
import * as crypto from 'crypto'
import generateKeyPair from "../utils/GenerateKeyPair";
import signWithPrivateKey from "../utils/Signature";
import { UserRepository } from "../Repository/userRepository";
import NotificationModel from "../Models/notificationSchema";
import { getRecieverSocketId, io } from "../server";
import { AdminRepository } from "../Repository/adminRepository";
import SkillSchema from "../Models/skillSchema";


require('dotenv').config();

export class FreelancerService {

    private awsConfig = new AwsConfig()


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
                    console.log(certficate, 'this is the certification url')
                }
            }
            console.log(data.skills)
            let skill = []
            for(let val of data.skills){
                let skills: any = await SkillSchema.findOne({name: val})
                skill.push(skills._id)
            }
            console.log(skill,'these are the skill id')
            console.log(data, 'this is the data we got in freelancer serivce')
            const category = await FreelancerRepository.getSingleCategory(data.experience.expertise)
            console.log(category, 'this is the category we find')
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

            const freelancerData = await FreelancerRepository.saveApplication(appData as any)
            if (!freelancerData) {
                throw AppError.conflict('Failed to save freelancer application');
            }
            console.log(freelancerData);
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('Application Error', 500, error.message || 'An error occured while processing the application');
        }
    }

    updateProfileService = async(id: string, data: any  )=>{
        try {
            console.log('yeah its here')
            const bucketName =  process.env.BUCKET_NAME
            console.log(data.photo,'this is the data photo of the freelancer to update')
            
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

            const freelancerData = await FreelancerRepository.updateFreelancerProfile(id, data)
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
            const data = await FreelancerRepository.getFreelancerDetail(id)
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
            console.log(freelancerData, 'this is the freelancer data to be send')
            return freelancerData
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError('DetailRetrievalError', 500, error.message || 'Failed to retrieve freelancer details')
        }
    }

    createProposalService = async (data: any, userId: string, jobId: string, freelancerId: string) => {
        try {
            const jobData = await FreelancerRepository.getSingleJobData(jobId)
            if (jobData) {
                const proposals: any = await FreelancerRepository.getProposals(freelancerId)
                console.log(proposals,'this is proposal')
                const isProposalExist = proposals.some((proposal: any) =>
                    jobData.proposals?.includes(proposal._id))
                console.log(isProposalExist)
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
                        const createProposal = await FreelancerRepository.createJobProposal(proposalData)

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
            const proposals = await FreelancerRepository.getProposals(id)
            return proposals
        } catch (error: any) {
            console.log(error)
            throw new Error(error)
        }
    }

    acceptOfferService = async (data: any) => {
        try {
            if (data.termsAccepted == true) {
                const offer = await FreelancerRepository.changeOfferStatus(data)
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
                        const job = await FreelancerRepository.getSingleJobData(job_id)

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


                        const newContract = new ContractSchema({
                            ...contract,
                            contractHash
                        });

                        

                        await newContract.save();
    
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
            console.log(id,'this is the id we got herer')
            const contract = await FreelancerRepository.getContracts(id)
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
            console.log(contractId,'this is the contract id')
            const contract: any = await FreelancerRepository.getContractDetails(freelancerId, contractId)
            console.log(contract,'this is the contract we got here')
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
            console.log(publicKey,privateKey,'these are the keys')

            const signature = signWithPrivateKey(hash, privateKey)
            console.log(signature,'this is the signature')
            
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
            const contract = await UserRepository.getSingleContract(id);
            if (!contract) {
                throw AppError.notFound('Contract not found');
            }
            console.log('its here , the issue is something else')
            if (contract.status === 'completed' || contract.status === 'terminated') {
                throw AppError.conflict('Cannot change the status');
            }
    
            if (contract.status !== status) {
                console.log(status,'this is status')
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
            const proposal = await FreelancerRepository.deleteProposal(id)
            return proposal
        } catch (error) {
            
        }
    }

    getWorkHistoryService = async(id: string)=>{
        try {
            const workHistroy = await FreelancerRepository.getWorkHistory(id)
            
            return workHistroy
        } catch (error: any) {
            throw new AppError(
                'Failed getting History',
                500,
                error.message || 'An unexpected error occurred'
            );
        }
    }
    
    getDashboardDataService = async(id: string)=>{
        try {
            const contracts = await FreelancerRepository.getContracts(id)
            if(!contracts){
                throw AppError.notFound('No contract have been found for this freelancer')
            }
            const projects = contracts.filter((contract: any)=>contract.status == 'completed')
            const totalProject = projects.length
            const earnings = projects.reduce((sum,contract)=> sum + contract.totalEarnings, 0)
            const activeContract = contracts.filter((contract)=> contract.status == 'active' || contract.status == 'submitted' || contract.status == 'initial_payment').length
            
            const recentProjects = await FreelancerRepository.getRecentContracts(id )
            const ratingReview = await FreelancerRepository.getReviewRating(id)

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

}