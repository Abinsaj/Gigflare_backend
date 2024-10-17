import { createToken } from "../Config/jwtConfig";
import FreelancerApplication from "../Models/applicationForm";
import userModel from "../Models/userSchema";
import { FreelancerRepository } from "../Repository/freelancerRepository";
import { UserRepository } from "../Repository/userRepository";

require('dotenv').config()

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD

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
            console.log(accessToken)
            return adminInfo
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getUsersListService = async()=>{
        try {
            const users = await UserRepository.getUsers()
            console.log(users, ' this is the users list ')
            const cleanedUsers = users.map((user: any)=>{
                const {userID,name, email, phone, isBlocked, isFreelancer, created_At} = user._doc
                return {
                    userID,
                    name,
                    email,
                    phone,
                    isBlocked,
                    isFreelancer,
                    created_At: created_At.toISOString().slice(0, 10)
                }
            })
            return { users: cleanedUsers}
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getFreelancerApplicaitonService = async()=>{
        try {
            console.log('ithththth ehehhrereer')
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
            console.log('its already')
            console.log(status,'ivida indaya mathi')
            const updateData = await FreelancerRepository.updateStatus(applicationId,status)
            if(!updateData){
                return false
            }else{
                return true
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
}