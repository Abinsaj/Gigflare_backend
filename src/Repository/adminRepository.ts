import { application } from "express";
import CategorySchema from "../Models/categorySchema";
import { ObjectId } from "mongoose";
import FreelancerApplication from "../Models/applicationSchema";
import jobModel from "../Models/jobSchema";
import ContractSchema from "../Models/contractSchema";
import AppError from "../utils/AppError";
import SkillSchema from "../Models/skillSchema";

export class AdminRepository {
    static async createCatregory(name: string, description: string) {
        try {

            const category = await CategorySchema.findOne({
                name: { $regex: new RegExp(`${name}$`, 'i') }
            })

            if (category) {
                throw new Error('Category Already exist')
            }
            const newCategory = CategorySchema.create({
                name: name,
                description: description
            })
            return newCategory
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    static async getCategories() {
        try {
            const data = await CategorySchema.find()
            if (!data) {
                throw new Error('No category data found')
            }
            return data
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    static async blockUnblockCategory(name: string, status: boolean | undefined) {
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

    static async removeCategory(name: string) {
        try {
            console.log(name, 'this is the name')
            const category = await CategorySchema.findOneAndDelete({ name })
            return true
        } catch (error) {
            console.log(error)
        }
    }

    static async getFreelancers() {
        try {
            const freelancer = await FreelancerApplication.find({ status: 'accepted' })
            return freelancer
        } catch (error) {
            console.log(error)
        }
    }

    static async getJobs() {
        try {
            const jobData = await jobModel.find({}).populate('skillsRequired').populate('category')
            if (!jobData) {
                return { message: "No data found" }
            }
            return jobData
        } catch (error) {
            console.log(error)
        }
    }

    static async blockJob(_id: string, status: string | 'block' | 'unblock') {
        try {
            let updateData
            if (status == 'block') {
                updateData = await jobModel.findByIdAndUpdate({ _id },
                    {
                        isBlocked: true
                    }
                )
            } else {
                updateData = await jobModel.findByIdAndUpdate({ _id },
                    {
                        isBlocked: false
                    }
                )
            }
            return updateData
        } catch (error) {
            console.log(error)
        }
    }

    static async activateJob(_id: string) {
        try {
            const updatedData = await jobModel.findByIdAndUpdate({ _id },
                {
                    isActive: true
                }
            )
            return updatedData
        } catch (error) {
            console.log(error)
        }
    }

    static async getContratRepo() {
        try {
            const contracts = await ContractSchema.find({})
                .populate('freelancerId')
                .populate('clientId')
                .populate('jobId')
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

    static async createSkills(data: any) {
        try {
            console.log(data, 'Data in repository')
            const skill = await SkillSchema.findOne({
                name: { $regex: new RegExp(`${data.name}$`, 'i') }
            })
            if (skill) {
                throw AppError.conflict('Skill already exists')
            }
            console.log('this is hereererrereerereeeereer')
            const newSkill = await SkillSchema.create({
                name: data.name,
                category: data.category,
                description: data.description,
            })
            console
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

    static async getSkills(page: any, limit: any) {
        try {
            const data = await SkillSchema.find().skip((page-1)*limit).limit(Number(limit)).populate('category')

            const totalItems = await SkillSchema.countDocuments();
            const totalPages = Math.ceil(totalItems / limit);
            console.log(totalPages)
        
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

    static async blockUnblockSkills(id: string, status: boolean | undefined) {
        try {
            const updatedData = await SkillSchema.findOneAndUpdate(
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

    static async getGraphDataFromDB(startDate: Date, endDate: Date, timeframe: "MONTHLY" | "WEEKLY" | "YEARLY") {
        try {

            console.log(startDate, endDate,'this is the start and end date')
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
                        console.log(graphData)
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