import { IUser } from "../Interfaces/common.interface";
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
            console.log('Ithu ivida ethikku too')
            const user = await userModel.findOne(
                {email},
                {
                    _id: 0,
                    userId: 1,
                    name: 1,
                    email: 1,
                    password: 1,
                    phone: 1,
                    isBlocked: 1,
                }
            )
            return user
        } catch (error) {
            throw new Error('verify login failed')
        }
    }

    static async getUsers(){
        try {
            const users = await userModel.find({},
                {
                    _id:0,
                    userId:1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    created_At: 1,
                    isFreelancer: 1,
                    isBlocked: 1,
                }
            )
            console.log(users)
            return users
        } catch (error) {
            throw new Error('failed to fetch users list from the db')
        }
    }

    static async verifyEmail(email: string){
        try {
            console.log('Hi ivida inda ')
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
                console.log('the blocked freelancer is',user)
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
            console.log(user)
            if(!user){
                throw new Error('no user have found')
            }else{
                user.isBlocked = isBlocked;
                console.log('the blocked freelancer is',user)
                await user.save()
                return true
            }
        } catch (error) {
            
        }
    }
}