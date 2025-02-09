import { application } from "express";
import CategorySchema from "../Models/categorySchema";
import { Model, ObjectId } from "mongoose";
import FreelancerApplication from "../Models/applicationSchema";
import jobModel from "../Models/jobSchema";
import ContractSchema from "../Models/contractSchema";
import AppError from "../utils/AppError";
import SkillSchema from "../Models/skillSchema";
import IAdminRepository from "../Interfaces/AdminInterface/admin.repository.interface";
import IJob, { ICategory, IContract, IFreelancer, ISkill, IUser } from "../Interfaces/common.interface";
import { BaseRepository } from "./baseRepository";
import sentApplicationMail from "../Config/rejectionEmailConfig";

export class AdminRepository implements IAdminRepository {

    private userRepo: BaseRepository<IUser>
    private freelancerRepo: BaseRepository<IFreelancer>
    private categoryRepo: BaseRepository<ICategory>
    private jobRepo: BaseRepository<IJob>
    private contractRepo: BaseRepository<IContract>
    private skillRepo: BaseRepository<ISkill>

    constructor(
        userModel: Model<IUser>,
        FreelancerApplication: Model<IFreelancer>,
        catergoryModel: Model<ICategory>,
        jobModel: Model<IJob>,
        contractModel: Model<IContract>,
        skillModel: Model<ISkill>
    ) {
        this.userRepo = new BaseRepository(userModel)
        this.freelancerRepo = new BaseRepository(FreelancerApplication)
        this.categoryRepo = new BaseRepository(catergoryModel)
        this.jobRepo = new BaseRepository(jobModel)
        this.contractRepo = new BaseRepository(contractModel)
        this.skillRepo = new BaseRepository(skillModel)
    }

    getUsers = async (page: any, limit: any) => {
        try {
            const limitValue = Number(limit)
            const pages = Number(page)
            const skip = (pages -1 )*limitValue
            const user = await this.userRepo.findAll({}, limitValue, skip)
            const totalItems = await this.userRepo.countDoc()
            const totalPages = Math.ceil(totalItems / limit)
            if (!user) {
                throw AppError.notFound('No user have been found')
            }
            return {user, totalPages}
        } catch (error: any) {
            throw new AppError(
                'FailedFetchUsers',
                500,
                error.message || 'Error fetching Notification'
            )
        }
    }

    getFreelancerApplications = async (page: any, limit: any) => {
        try {
            const pageNumber = Number(page);  
            const limitValue = Number(limit) ;
            const skip = (pageNumber - 1) * limitValue
            const freelancer = await this.freelancerRepo.findAll({}, limitValue, skip)
            const totalItems = await this.freelancerRepo.countDoc()
            const totalPages = Math.ceil(totalItems / limit);
            if (!freelancer) {
                throw AppError.conflict('No freelancers have found')
            }

            return { freelancer, totalPages }
        } catch (error) {
            throw error
        }
    }

    updateStatus = async (applicationId: string, status: string) => {
        try {
            const updatedApplication = await this.freelancerRepo.updateAndReturn(
                { applicationId },
                { $set: { status: status } },
                { new: true }
            );
            if (!updatedApplication) {
                return false;
            }


            const user = await this.userRepo.find({ email: updatedApplication.email });

            if (user) {
                if (updatedApplication.status === 'accepted') {
                    const mailresult = await sentApplicationMail(user.email, 'accepted')
                    user.isFreelancer = true;

                    user.freelancerCredentials = {
                        email: updatedApplication.email,
                        uniqueID: updatedApplication.applicationId
                    };
                    await user.save();
                } else {
                    await sentApplicationMail(user.email, 'rejected')
                }
            }
            return updatedApplication
        } catch (error: any) {
            console.error('Error in updateStatus:', error);
            throw new Error(error);
        }
    }

    blockFreelancer = async (email: string, isBlocked: boolean) => {
        try {
            const user = await this.userRepo.find({ email })
            if (!user) {
                throw new Error('no user have found')
            } else {
                user.isBlocked = isBlocked;
                await user.save()
                return true
            }

        } catch (error: any) {
            throw new Error(error)
        }
    }

    blockUser = async(email: string, isBlocked: boolean) => {
        try {
            const user = await this.userRepo.find({ email })
            if (!user) {
                throw new Error('no user have found')
            } else {
                user.isBlocked = isBlocked;
                await user.save()
                return true
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    createCatregory = async(name: string, description: string) => {
        try {

            const category = await this.categoryRepo.find({
                name: { $regex: new RegExp(`${name}$`, 'i') }
            })

            if (category) {
                throw new Error('Category Already exist')
            }
            const newCategory = this.categoryRepo.create({
                name: name,
                description: description
            })
            return newCategory
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getCategories = async() =>{
        try {
            const data = await this.categoryRepo.findAll({},0,0)
            if (!data) {
                throw new Error('No category data found')
            }
            return data
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    blockUnblockCategory = async(name: string, status: boolean | undefined) =>{
        try {
            const data = await CategorySchema.findOneAndUpdate(
                { name },
                {
                    $set: { isBlocked: status }
                },
                { new: true }
            );
            if (!data) {
                throw new Error('category not found')
            }
            return true
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    removeCategory = async(name: string) =>{
        try {
            const category = await CategorySchema.findOneAndDelete({ name })
            return true
        } catch (error) {
            console.log(error)
        }
    }

    getFreelancers = async (page: any,limit: any) => {
        try {
            const pageNumber = Number(page);  
            const limitValue = Number(limit) ;
            const skip = (pageNumber - 1) * limitValue
            const freelancer = await this.freelancerRepo.findAll({ status: 'accepted' },limitValue,skip)
            const totalItems = await this.freelancerRepo.countDoc()
            const totalPages = Math.ceil(totalItems / limit)
            return {freelancer,totalPages}
        } catch (error) {
            console.log(error)
        }
    }

    getJobs = async() =>{
        try {
            const jobData = await this.jobRepo.findAll({},0,0,['skillsRequired','category'])
            if (!jobData) {
                throw AppError.notFound('No data have found')
            }
            return jobData
        } catch (error) {
            console.log(error)
        }
    }

    // static async blockJob(_id: string, status: string | 'block' | 'unblock') {
    //     try {
    //         let updateData
    //         if (status == 'block') {
    //             updateData = await jobModel.findByIdAndUpdate({ _id },
    //                 {
    //                     isBlocked: true
    //                 }
    //             )
    //         } else {
    //             updateData = await jobModel.findByIdAndUpdate({ _id },
    //                 {
    //                     isBlocked: false
    //                 }
    //             )
    //         }
    //         return updateData
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }

    activateJob = async(_id: string) =>{
        try {
            const updatedData = await this.jobRepo.updateAndReturn({ _id },
                {
                    isActive: true
                }
            )
            return updatedData
        } catch (error) {
            console.log(error)
        }
    }

    getContractRepo = async() =>{
        try {
            const contracts = await this.contractRepo.findAll({},0,0,['freelancerId','clientId','jobId'])
            if (contracts == null) {
                throw AppError.notFound('No contract have been made till')
            }
            return contracts
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedFetchingContract',
                500,
                error.message || 'Unexpected error occured'
            )
        }
    }

    createSkills = async(data: any)=> {
        try {
            const skill = await this.skillRepo.find({
                name: { $regex: new RegExp(`${data.name}$`, 'i') }
            })
            if (skill) {
                throw AppError.conflict('Skill already exists')
            }
            const newSkill = await this.skillRepo.create({
                name: data.name,
                category: data.category,
                description: data.description,
            })
            return newSkill;
        } catch (error: any) {
            console.log(error)
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedFetchingContract',
                500,
                error.message || 'Unexpected error occured'
            )
        }
    }

    getSkills = async(page: any, limit: any) =>{
        try {
            const skip = (page-1)*limit
            const data = await this.skillRepo.findAll({},skip,limit,['category'])

            const totalItems = await this.skillRepo.countDoc();
            const totalPages = Math.ceil(totalItems / limit);

            if (!data) {
                throw AppError.notFound('No skills have been found')
            }
            return {data,totalPages}
        } catch (error: any) {
            throw new AppError('FailedFetchingSkills',
                500,
                error.message || 'Unexpected error occured'
            )
        }
    }

    blockUnblockSkills = async(id: string, status: boolean | undefined)=> {
        try {
            const updatedData = await this.skillRepo.updateAndReturn(
                { _id: id },
                {
                    $set: { isBlocked: status }
                },
                { new: true }
            )
            if (!updatedData) {
                throw AppError.notFound('No skill have been found')
            }
            return updatedData
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedFetchingContract',
                500,
                error.message || 'Unexpected error occured'
            )
        }
    }

    getGraphDataFromDB = async(startDate: Date, endDate: Date, timeframe: "MONTHLY" | "WEEKLY" | "YEARLY")=> {
        try {

            const groupByField =
                timeframe === 'WEEKLY'
                    ? { $isoWeek: '$createdAt' }
                    : timeframe === 'MONTHLY'
                        ? { $month: '$createdAt' }
                        : { $year: '$createdAt' };
                        const graphData = await ContractSchema.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lte: endDate }, 
                                    status: { $in: ['active', 'submitted', 'completed'] }, 
                                },
                            },
                            {
                                $group: {
                                    _id: groupByField,
                                    totalIncome: { $sum: '$platformFee' }, 
                                },
                            },
                            {
                                $sort: { _id: 1 }, 
                            },
                        ]);
                        return graphData.map(item => ({
                            label: item._id, 
                            totalIncome: item.totalIncome,
                        }));
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error
            }
            throw new AppError('FailedFetchingContract',
                500,
                error.message || 'Unexpected error occured'
            )
        }
    }

}