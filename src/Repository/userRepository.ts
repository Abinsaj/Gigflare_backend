import { IUser } from "../Interfaces/common.interface";
import FreelancerApplication from "../Models/applicationSchema";
import jobModel, { IJob } from "../Models/jobSchema";
import userModel from "../Models/userSchema";
import bcrypt from 'bcrypt'


export class UserRepository {
    static async existUser(email: string): Promise<IUser | null> {
        try {
            const existUser = await userModel.findOne({email});
            return existUser;
        } catch (error:any) {
            throw new Error('Database query failed');
        };
    };
    static async createUser(userData: any): Promise<IUser>{
        try {
            const newUser = new userModel(userData)
            return await newUser.save()
        } catch (error: any) {
            console.log('Error in creating new user');
            throw new Error (`Error in creating user : ${error.message}`,)
        }
    }
    static async verifyLogin(email: string, password: string): Promise<any>{
        try {
            const user = await userModel.findOne(
                {email:email}
            )
            return user
        } catch (error) {
            throw new Error('verify login failed')
        }
    }

    static async getUsers(){
        try {
            console.log('hfla dhe ivide also')
            const users = await userModel.find({})
            console.log(users,'fasd')
            return users
        } catch (error) {
            throw new Error('failed to fetch users list from the db')
        }
    }

    static async verifyEmail(email: string){
        try {
            const user = await userModel.findOne({email})

            if(!user){
                return false
            }else{
                return true
            }
        } catch (error) {
            throw new Error('error verifying the email')
        }
    }

    static async changePassword(password: string, email: string | null){
        try {
            console.log('ithu ivida repository ethikku')
            const user = await userModel.findOneAndUpdate(
                {email:email},
                {password: password},
                {new: true}
            )
            if(!user){
                throw new Error('User not found')
            }
            return user
        } catch (error) {
            console.log('error updating password in the repository', error)
            throw new Error('Database Operation Failed')
        }
    }

    static async blockFreelancer(email: string, isBlocked: boolean){
        try {
            const user = await userModel.findOne({email})
            if(!user){
                throw new Error('no user have found')
            }else{
                user.isBlocked = isBlocked;
                await user.save()
                return true
            }
            
        } catch (error: any) {
            throw new Error(error)
        }
    }

    static async blockUser(email: string, isBlocked: boolean){
        try {
            const user = await userModel.findOne({email})
            if(!user){
                throw new Error('no user have found')
            }else{
                user.isBlocked = isBlocked;
                await user.save()
                return true
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    static async createJob(data: any){
        try {
            const newJob = new jobModel(data)
            return await newJob.save()
        } catch (error:any) {
            throw new Error(error.message)
        }
    }

    static async addAddress(data: any, id: string){
        try {
            const user = await userModel.findOneAndUpdate({userId:id},
                {$push: {
                    address: data
                }}
            )
            return user
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    static async getUserInfo(userId: string){
        try {
            const userData = await userModel.findOne({userId})  
            
            return userData
        } catch (error) {
            throw new Error('An unexpected error has occured')
        }
    }

    static async getFreelancerDetails(){
        try {
            const data = await FreelancerApplication.find({status:'accepted'})
            if(!data){
                throw new Error('No data have been found')
            }
            return data
        } catch (error: any) {
            throw new Error(error.message || "An unexpectd error has occured")
        }
    }

    static async userChangePassword(password: string, userId: string){
        try {
            const data = await userModel.findOneAndUpdate(
                {userId:userId},
                {password:password},
                {new: true}
            )
            if(!data){
                throw new Error('No user found')
            }
            return data
        } catch (error) {
            throw new Error('Database operation failed')
        }
    }

    static async findByEmail(email:string){
        try {
            const data = await userModel.findOne({email:email})
            return data
        } catch (error) {
            console.log(error)
        }
    }

    static async saveUser(user:IUser){
        try {
            console.log('omg its reached here')
            const newUser = new userModel(user)
            console.log(newUser,'this is the new user')
            await newUser.save()
            return newUser
        } catch (error) {
            console.log(error)
            return null
        }
    }
}