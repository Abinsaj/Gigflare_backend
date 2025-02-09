import { createRefreshToken, createToken } from "../Config/jwtConfig";
import FreelancerApplication from "../Models/applicationSchema";
import { FreelancerRepository } from "../Repository/freelancerRepository";
import { UserRepository } from "../Repository/userRepository";
import { AdminRepository } from "../Repository/adminRepository";
import { AwsConfig } from "../Config/awsFileConfig";
import AppError from "../utils/AppError";
import Stripe from "stripe";
import IJob from "../Interfaces/common.interface"
import IAdminService from "../Interfaces/AdminInterface/admin.service.interface";
import IAdminRepository from "../Interfaces/AdminInterface/admin.repository.interface";
import { IFreelancerRepository } from "../Interfaces/FreelancerInterface/freelancer.repository.interface";
import { AnyBulkWriteOperation } from "mongoose";

require('dotenv').config()

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD
const aws = new AwsConfig()
const stripe = new Stripe(process.env.STRIPE_SECRET! as string)

export class AdminService implements IAdminService {

    private adminRepository: IAdminRepository
    private freelancerRepository: IFreelancerRepository

    constructor(
        adminRepository: IAdminRepository,
        freelancerRepository: IFreelancerRepository
    ) {
        this.adminRepository = adminRepository
        this.freelancerRepository = freelancerRepository
    }

    verifyAdmin = async (email: string, password: string): Promise<{ adminInfo: string } | void | any> => {
        try {
            if (email !== adminEmail) {
                throw new Error('Invalid Email')
            } else if (password !== adminPassword) {
                throw new Error('Wrong Password')
            }
            const adminInfo = {
                email
            }
            const accessToken = createToken(email as string, 'Admin')
            const refreshToken = createRefreshToken(email as string, "Admin")
            return { accessToken, adminInfo, refreshToken }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getUsersListService = async (page:any,limit: any) => {
        try {
            const users = await this.adminRepository.getUsers(page,limit)
            if (!users) {
                throw new Error('No data have found')
            }
            // const cleanedUsers = users.map((user: any)=>{
            //     const {userID,name, email, isBlocked, isFreelancer, created_At} = user._doc
            //     return {
            //         userID,
            //         name,
            //         email,
            //         isBlocked,
            //         isFreelancer,
            //         createdAt: created_At.toISOString().slice(0, 10)
            //     }
            // })
            return users
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getFreelancerApplicaitonService = async (page: any, limit: any) => {
        try {
            const freelancer = await this.adminRepository.getFreelancerApplications(page, limit)
            if (!freelancer) {
                throw new Error('No data have been found')
            } else {
                return freelancer
            }
        } catch (error) {
            throw error
        }
    }

    updateFreelancerService = async (applicationId: string, status: string) => {
        try {
            const updateData = await this.adminRepository.updateStatus(applicationId, status)
            if (!updateData) {
                throw new Error('status updation failed')
            } else {
                return updateData
            }
        } catch (error) {
            throw error
        }
    }

    blockFreelancerService = async (email: string, isBlocked: boolean) => {
        try {
            const blockData = await this.adminRepository.blockFreelancer(email, isBlocked)
            if (blockData) {
                return true
            } else {
                throw new Error('failed to block user')
            }
        } catch (error) {
            throw new Error
        }
    }

    blockUserService = async (email: string, isBlocked: boolean) => {
        try {
            const blockData = await this.adminRepository.blockUser(email, isBlocked)
            if (blockData) {
                return true
            } else {
                throw new Error('failed to block user')
            }
        } catch (error) {
            throw new Error
        }
    }

    createCategoryService = async (name: string, description: string) => {
        try {

            const createCategory = await this.adminRepository.createCatregory(name, description)
            if (createCategory) {
                return true
            } else {
                throw new Error('Failed to add category')
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getCategoryService = async () => {
        try {
            const categories = await this.adminRepository.getCategories()
            return categories
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    removeCategoryService = async (name: string) => {
        try {
            const data = await this.adminRepository.removeCategory(name)
            return data
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('FailedToRemoveCategory',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }

    blockUnblockCategoryService = async (name: string, status: string) => {
        try {
            let newStatus
            if (status == "block") {
                newStatus = true
            } else if (status == "unblock") {
                newStatus = false
            }
            const blockData = await this.adminRepository.blockUnblockCategory(name, newStatus)
            if (blockData) {
                return true
            } else {
                throw new Error('Failed to change the status')
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getFreelancerService = async (id: string) => {
        try {
            const freelancerData = await this.freelancerRepository.getFreelancerDetail(id)
            if (!freelancerData) {
                throw new Error('no data have been found')
            } else {
                const image = await aws.getFile('freelancerApplication/photo', freelancerData.photo?.fileurl)

                let certificateImg = ''
                for (const image of freelancerData.certficatImage!) {
                    certificateImg = await aws.getFile('freelancerApplication/certification', image)
                }

                return { freelancerData, image, certificateImg }
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getFreelancersService = async (page: any, limit: any) => {
        try {

            const data = await this.adminRepository.getFreelancers(page,limit)
            if (!data) {
                throw new Error('No data have been found')
            }
            return data
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getJobsService = async()=>{
        try {
            const jobData = await this.adminRepository.getJobs()
            if(!jobData){
                throw AppError.notFound('no data have been found')
            }
            return jobData
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('FailedToFetchJobData',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }

    jobActivateService = async (id: string) => {
        try {
            const updatedData = await this.adminRepository.activateJob(id)
            return updatedData
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getContractService = async()=>{
        try {
            const contracts = await this.adminRepository.getContractRepo()
            if(!contracts){
                throw AppError.notFound('No contract have been found')
            } 
            return contracts   
        } catch (error:any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('FailedToGetContract',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }

    createSkillService = async (data: any) => {
        try {
            const skillData = {
                name: data.name,
                category: data.category,
                description: data.description,
            }
            const skill = await this.adminRepository.createSkills(skillData)
            if (skill) {
                return true
            } else {
                throw AppError.badRequest('Failed to add Skill')
            }
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

    getSkillsService = async(page: any, limit: any)=>{
        try {
            const data = await this.adminRepository.getSkills(page, limit)
            return data
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedToFEtchSkills',
                500,
                error.message || 'Unexpected Error'
            )
        }
    }

    blockUnblockSkillService = async (id: string, status: 'block' | 'unblock') => {
        try {
            let newStatus
            if (status == "block") {
                newStatus = true
            } else if (status == "unblock") {
                newStatus = false
            }
            const data = await this.adminRepository.blockUnblockSkills(id, newStatus)
            return data
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

    getTransactionService = async () => {
        try {
            const contracts: any = await this.adminRepository.getContractRepo()
            const transactions = []
            if (!contracts) {
                throw AppError.notFound('No contract have been found')
            }
            const allSessions = await stripe.checkout.sessions.list({ limit: 100 });
            for (const contract of contracts) {
                let contractId = contract._id.toString()

                const matchingSessions = allSessions.data.filter(
                    (session) => session.metadata?.contractId == contractId
                )
                for (const session of matchingSessions) {
                    const paymentIntendId = session.payment_intent;

                    if (typeof paymentIntendId == 'string') {
                        const paymentIntentResponse = await stripe.paymentIntents.retrieve(paymentIntendId)
                        const latestChargeId: any = paymentIntentResponse.latest_charge

                        let paymentMethodDetails: Stripe.Charge.PaymentMethodDetails | null = null;
                        let chargeDetails: Stripe.Charge | null = null;
                        let receiptUrl: string | null = null

                        if (latestChargeId) {
                            chargeDetails = await stripe.charges.retrieve(latestChargeId);
                            paymentMethodDetails = chargeDetails.payment_method_details
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
                            freelancer: contract.freelancerId.firstName + contract.freelancerId.lastName,
                            client: contract.clientId.name,
                            sessionId: session.id,
                            amount: amountInRupees,
                            currency: paymentIntentResponse.currency,
                            status: paymentIntentResponse.status,
                            created: formattedDate,
                            transactionId: chargeDetails?.id,
                            receiptUrl: receiptUrl,
                            paymentMethod: paymentMethodDetails,
                        })
                    } else {
                        console.warn(`Invalid paymentIntentId for session ${session.id}: ${paymentIntendId}`);
                    }
                }
            }
            return transactions
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('PaymentConfirmationFailed',
                    500,
                    error.message || 'Unexpected Error'
                )
            }

        }
    }

    getDashboardDataService = async () => {
        try {
            const contractData = await this.adminRepository.getContractRepo()
            const jobData: any = await this.adminRepository.getJobs()

            const recentContracts = contractData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const totalJobs = jobData.filter((job: any) => job.status === 'open' || job.status == 'completed').length;
            const activeContracts = contractData.filter((contract: any) => contract.status === 'active' && contract.paymentStatus == 'partially_paid').length;
            const completedContracts = contractData.filter((contract: any) => contract.status === 'completed').length
            const allActiveCompletedContract = contractData.filter((contract: any) =>
                contract.status == 'completed' || contract.status == 'active' || contract.paymentStatus == 'partially_paid')
            const totalProfit = allActiveCompletedContract.reduce((sum, contract) => sum + contract.platformFee, 0)
            return {
                totalJobs,
                activeContracts,
                completedContracts,
                totalProfit,
                recentContracts
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('PaymentConfirmationFailed',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }

    getGraphDataService = async (timeframe: string) => {
        try {
            let startDate: Date
            const endDate = new Date();

            switch (timeframe) {
                case "WEEKLY":
                    startDate = new Date();
                    startDate.setDate(endDate.getDate() - (endDate.getDay() + 7));
                    break;
                case "MONTHLY":
                    startDate = new Date();
                    startDate.setMonth(endDate.getMonth() - 6); 
                    break;
                case "YEARLY":
                    startDate = new Date();
                    startDate.setFullYear(endDate.getFullYear() - 3); 
                    break;
                default:
                        throw AppError.notFound('Invalid timeframe');    
            }

            const data: any = await this.adminRepository.getGraphDataFromDB(startDate, endDate, timeframe)

            const getMonthName = (month: number) => {
                const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                return months[month - 1];
            };

            const formatGraphData = (data: any[], timeframe: string) => {
                return data.map(item => ({
                    label: timeframe === 'MONTHLY' ? getMonthName(item.label) : item.label,
                    value: item.totalIncome,
                }));
            };

            return formatGraphData (data, timeframe)


        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            } else {
                throw new AppError('FailedToGetGraphData',
                    500,
                    error.message || 'Unexpected Error'
                )
            }
        }
    }



}