import { createRefreshToken, createToken } from "../Config/jwtConfig";
import FreelancerApplication from "../Models/applicationSchema";
import { FreelancerRepository } from "../Repository/freelancerRepository";
import { UserRepository } from "../Repository/userRepository";
import { AdminRepository } from "../Repository/adminRepository";
import { AwsConfig } from "../Config/awsFileConfig";


require('dotenv').config()

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD
const aws = new AwsConfig()

export class AdminService{
    verifyAdmin = async(email: string, password: string): Promise<{adminInfo: string} | void | any>=>{
        try {
            if(email !== adminEmail){
                throw new Error('Invalid Email')
            }else if(password !== adminPassword){
                throw new Error('Wrong Password')
            }
            const adminInfo = {
                email
            }
            const accessToken = createToken(email as string, 'Admin')
            const refreshToken = createRefreshToken(email as string, "Admin")
            return {accessToken,adminInfo,refreshToken}
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getUsersListService = async()=>{
        try {
            const users = await UserRepository.getUsers()
            if(!users){
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
            // console.log('appo ntho issue here')
            return users
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getFreelancerApplicaitonService = async()=>{
        try {
            const freelancer = await FreelancerRepository.getFreelancerApplications()
            if(!freelancer){
                throw new Error('No data have been found')
            }else{
                return freelancer
            } 
        } catch (error) {
            throw error
        }
    }

    updateFreelancerService = async(applicationId: string,status: string)=>{
        try {
            const updateData = await FreelancerRepository.updateStatus(applicationId,status)
            console.log(updateData)
            if(!updateData){
                throw new Error('status updation failed')
            }else{
                return updateData
            }
        } catch (error) {
            throw error
        }
    }

    blockFreelancerService = async(email: string, isBlocked: boolean)=>{
        try {
            const blockData = await UserRepository.blockFreelancer(email,isBlocked)
            if(blockData){
                return true
            }else{ 
                throw new Error('failed to block user')
            }
        } catch (error) {
            throw new Error
        }
    }

    blockUserService = async(email: string, isBlocked: boolean)=>{
        try {
            const blockData = await UserRepository.blockUser(email,isBlocked)
            if(blockData){
                return true
            }else{ 
                throw new Error('failed to block user')
            }
        } catch (error) {
            throw new Error
        }
    }

    createCategoryService = async(name:string, description: string)=>{
        try {
            
            const createCategory = await AdminRepository.createCatregory(name,description)
            if(createCategory){
                return true
            }else{
                throw new Error('Failed to add category')
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getCategoryService = async()=>{
        try {
            const categories = await AdminRepository.getCategories()
            return categories
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    blockUnblockCategoryService = async(name: string, status: string)=>{
        try {
            let newStatus 
            if(status == "block"){
                newStatus = true
            }else if(status == "unblock"){
                newStatus = false
            }
            const blockData = await AdminRepository.blockUnblockCategory(name, newStatus)
            if(blockData){
                return true
            }else{
                throw new Error('Failed to change the status')
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getFreelancerService = async(id: string)=>{
        try {
            const freelancerData = await FreelancerRepository.getFreelancerDetail(id)
            if(!freelancerData){
                throw new Error('no data have been found')
            }else{
                const image = await aws.getFile('freelancerApplication/photo',freelancerData.photo?.fileurl)

                let certificateImg = ''
                for(const image of freelancerData.certficatImage!){
                    certificateImg = await aws.getFile('freelancerApplication/certification',image)
                }

                return {freelancerData, image, certificateImg}
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getFreelancersService = async()=>{
        try {
            const data = await AdminRepository.getFreelancers()
            if(!data){
                throw new Error('No data have been found')
            }
            return data
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    jobActivateService = async(id: string)=>{
        try {
            const updatedData = await AdminRepository.activateJob(id) 
            return updatedData
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

}