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
            console.log(data, 'this is the data we got in freelancer serivce')
            const category = await FreelancerRepository.getSingleCategory(data.experience.expertise)
            console.log(category, 'this is the category we find')
            const experience = {
                categoryId: category!._id,
                expertise: data.experience.expertise,
                fromYear: data.experience.fromYear,
                toYear: data.experience.toYear
            }
            let photo = {
                fileurl: photoUrl
            }
            data.photo = photo
            data.certficatImage = certficateUrl
            data.experience = experience
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
                const proposals: any = await FreelancerRepository.getProposals(userId)
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
                        jobData.proposals?.push(proposalId)
                        await jobData.save()

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
            console.log('its in the service')
            if (data.termsAccepted == true) {
                console.log('yeah its true')
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
                            isTermsAccepted: data.termsAccepted,
                            
                        }
                        console.log(contract,'this is the contract to be created')

                        const contractString = JSON.stringify(contract);
                        const contractHash = crypto
                        .createHash('sha256')
                        .update(contractString)
                        .digest('hex')

                        console.log(contractHash,'this is the hased password')


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
    

}