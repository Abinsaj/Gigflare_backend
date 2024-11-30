import { application } from "express";
import CategorySchema from "../Models/categorySchema";
import { ObjectId } from "mongoose";
import FreelancerApplication from "../Models/applicationSchema";
import jobModel from "../Models/jobSchema";

export class AdminRepository{
    static async createCatregory(name:string, description:string){
        try {

            const category = await CategorySchema.findOne({
                name: { $regex: new RegExp(`${name}$`,'i')}
            })

            if(category){
                throw new Error('Category Already exist')
            }
            const newCategory =  CategorySchema.create({
                name:name,
                description:description
            })
            return newCategory
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    static async getCategories(){
        try {
            const data = await CategorySchema.find()
            if(!data){
                throw new Error('No category data found')
            }
            return data
        } catch (error: any) {
            throw  new Error(error.message)
        }
    }

    static async blockUnblockCategory(name: string, status: boolean | undefined){
        try {
            const data = await CategorySchema.findOneAndUpdate(
                {name},
                {
                    $set:{isBlocked: status}
                },
                {new: true}
            );
            if(!data){
                throw new Error('category not found')
            }
            return true
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    static async removeCategory(name: string){
        try {
            console.log(name,'this is the name')
            const category = await CategorySchema.findOneAndDelete({name})
            return true
        } catch (error) {
            console.log(error)
        }
    }

    static async getFreelancers(){
        try {
            const freelancer = await FreelancerApplication.find({status: 'accepted'})
            return freelancer
        } catch (error) {
            console.log(error)
        }
    }

    static async getJobs(){
        try {
            const jobData = await jobModel.find({})
            if(!jobData){
                return {message:"No data found"}
            }
            return jobData
        } catch (error) {
            console.log(error)
        }
    }

    static async blockJob(_id: string, status: string | 'block' | 'unblock'){
        try {
            let updateData
            if(status == 'block'){
                 updateData = await jobModel.findByIdAndUpdate({_id},
                    {
                        isBlocked: true
                    }
                )
            }else{
                 updateData = await jobModel.findByIdAndUpdate({_id},
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

    static async activateJob(_id: string){
        try {
            const updatedData = await jobModel.findByIdAndUpdate({_id},
                {
                    isActive: true
                }
            )
            return updatedData
        } catch (error) {
            console.log(error)
        }
    }

}