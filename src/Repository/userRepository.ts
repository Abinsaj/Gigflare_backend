import e, { application } from "express";
import { IUser } from "../Interfaces/common.interface";
import FreelancerApplication from "../Models/applicationSchema";
import jobModel, { IJob } from "../Models/jobSchema";
import userModel from "../Models/userSchema";
import bcrypt from 'bcrypt'
import CategorySchema from "../Models/categorySchema";
import ProposalModel from "../Models/proposalSchema";
import mongoose, { ObjectId } from "mongoose";
import jobOfferModel from "../Models/jobOfferSchema";
import ContractSchema from "../Models/contractSchema";
import AppError from "../utils/AppError";
import { getRecieverSocketId, io } from "../server";
import NotificationModel from "../Models/notificationSchema";
import HTTP_statusCode from "../Enums/httpStatusCode";
import ReviewSchema from "../Models/reviewSchema";
import SkillSchema from "../Models/skillSchema";


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
            console.log(data,'This is the data we got in the repository')
            const newJob = new jobModel(data)
            return await newJob.save()
        } catch (error:any) {
            console.log(error,'this is the error caused')
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

    static async getUserInfo(_id: string){
        try {
            const userData = await userModel.findOne({_id:_id})  
            return userData
        } catch (error) {
            throw new Error('An unexpected error has occured')
        }
    }

    static async getFreelancerDetails(id: string, page: number, limit: number){
        try {
            const pageNumber = Math.max(1, page); 
            const pageLimit = Math.max(1, limit);
            const query = {status:'accepted',userId:{ $ne: id }}
            const data = await FreelancerApplication.find(query).skip((pageNumber-1)* pageLimit).limit(Number(pageLimit)).populate('skills')
            const totalCount = await FreelancerApplication.countDocuments(query)
            const totalPages = Math.ceil(totalCount/limit)
            if(!data){
                throw new Error('No data have been found')
            }
            return {data, totalPages}
        } catch (error: any) {
            throw new Error(error.message || "An unexpectd error has occured")
        }
    }

    static async userChangePassword(password: string, _id: string){
        try {
            const data = await userModel.findOneAndUpdate(
                {_id:_id},
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
            const newUser = new userModel(user)
            await newUser.save()
            return newUser
        } catch (error) {
            console.log(error)
            return null
        }
    }

    static async getUserJob(_id: string){
        try {
            const jobData = await jobModel.find({createdBy:_id}) 
            if(!jobData){
                throw new Error('No data have been found')
            }
            return jobData
        } catch (error) {
            console.log(error);
        }
    }

    static async getCategories(){
        try {
            const catData = await CategorySchema.find()
            if(!catData){
                throw new Error('No data have been found')
            }
            return catData
        } catch (error) {
            console.log(error)
        }
    }

    static async getProposals(jobId: string){
        try {
            const proposalData = await ProposalModel.find({jobId}).lean()
            console.log(proposalData,'this the data we got in Repository')
            return proposalData
        } catch (error) {
            console.log(error)
        }
    }

    static async getFreelancers(id:ObjectId[]){
        try {
            const data = await FreelancerApplication.find({_id:{$in:id}}).lean()
            return data
        } catch (error) {
            console.log(error) 
        }
    }

    static async approveProposal(id: string, status: 'rejected' | 'approved'){
        try {
            console.log(id, ' this is the id and this is hte status', status)
            const data = await ProposalModel.findByIdAndUpdate({_id: id},
                {
                    $set:{status:status}
                },
                {
                    new: true
                }
            )
            return data
        } catch (error) {
            console.log('Error updating proposal data',error)
            throw error
        }
    }

    static async getJobOffer(offerData: any,jobId: string, freelancerId: string, userId: string){
        try {
            const data = await jobOfferModel.findOne({freelancer: freelancerId})
            if(data){
                return {success: false}
            }else{

                const freelancerData = await FreelancerApplication.findOne({_id:freelancerId})
                const otherId = freelancerData?.userId

                const data = {
                    clientId: userId,
                    freelancerId: freelancerId,
                    jobId: jobId,
                    budget: offerData.budget,
                    fromDate: offerData.fromDate,
                    toDate: offerData.toDate,
                    upfrontAmount: offerData.upfrontAmount,
                    restAmount: offerData.completionAmount,
                    platformFee: offerData.platformFeeAmount,
                    attachmentUrl:offerData.attachment
                }

                console.log(data,'4242424242424242424242424242424242424242424242424242424242424242424242')
                const newData = await jobOfferModel.create(data)

                const offerNotification = await NotificationModel.create({
                    userId:otherId,
                    type: 'offer',
                    message:'You got an Job offer',
                    data: {
                        senderId: userId,
                        receiverId: freelancerId,
                    },
                })

                const recieverSocketId = getRecieverSocketId(otherId)
                console.log(recieverSocketId,'Socket ID of the freelancer')
                if(recieverSocketId){
                    io.to(recieverSocketId).emit('notifications',offerNotification)
                    io.to(recieverSocketId).emit('newOffer',offerNotification)
                }

                 await  newData.save()
                 return {success:true}
                
            }
        } catch (error) {
            console.log(error)
            // throw error
        }
    }

    static async getContracts(clientId: string){
        try {
            const data = await ContractSchema.find({
                $or: [
                    { clientId }, 
                    { freelancerId: clientId }
                ]
            })
            .populate('freelancerId')
            .populate('clientId')
            .populate('jobId')
            return data
        } catch (error: any) {
            throw new AppError('FetchContractDetailError',
                500,
                error.message || 'An unexpected error occured'
            )
        }
    }

    static async getContractDetails(userId: ObjectId, contractId: ObjectId){
        try {
            const contract = await ContractSchema.findOne({
                _id: contractId,
                $or:[
                    { freelancerId: userId },
                    { clientId: userId }
                ]
            })

            if (!contract) {
                throw AppError.notFound('Contract not found for the given user and contract ID');
            }
    
            return contract; 
        } catch (error: any) {
            if(error instanceof AppError){
                throw error
              }
                console.error('Error fetching contract details:', error.message);
                throw new AppError('FaieldFetchData',500,error.message || 'Failed to fetch contract details');
        }
    }

    static async getSingleContract(id: ObjectId){
        try {
            const data = await ContractSchema.findOne({_id:id}).populate('jobId').populate('freelancerId').populate('clientId')
            console.log(data)
            return data
        } catch (error: any) {
            throw new AppError('FetchContractFailed',
                500,
                error.message || 'Error fetching contract'
            )
        }
    }

    static async getNotification(id: string){
        try {
            const notification = await NotificationModel.find({userId:id})
            return notification
        } catch (error: any) {
            throw new AppError(
                'FailedFetchNotificaiton',
                500,
                error.message || 'Error fetching Notification'
            )
        }
    }

    static async changeNotificationStaus(id: string, type: 'proposal' | 'message' | 'offer' | 'contract'){
        try {
            console.log(id,type,'we got the id and type here in repository')
            let notification
            if(type == 'proposal'){
                notification = await NotificationModel.updateMany({userId:id, type: type},
                    {$set: { isRead: true}}
                )
                const recieverSocketId = getRecieverSocketId(id)
                const notif = await NotificationModel.find({userId: id})
                if(recieverSocketId && notif){
                    io.to(recieverSocketId).emit('notifications',notif)
                }
                return notification

            }
            if(type == 'offer'){
                notification = await NotificationModel.updateMany({userId:id, type: type},
                    {$set: { isRead: true}}
                )
                const recieverSocketId = getRecieverSocketId(id)
                const notif = await NotificationModel.find({userId: id})
                if(recieverSocketId && notif){
                    io.to(recieverSocketId).emit('notifications',notif)
                }
                return notification
            }
        } catch (error: any) {
            throw new AppError(
                'FailedFetchNotificaiton',
                500,
                error.message || 'Error fetching Notification'
            )
        }
    }

    static async messageNotificationChange (sender: string, receiver: string){
        try {
            console.log(sender, receiver,'The ids')
            
            const notification = await NotificationModel.updateMany(
                {
                    userId: sender,
                    type: 'message',
                    'data.sender': new mongoose.Types.ObjectId(receiver),
                    'data.receiver': new mongoose.Types.ObjectId(sender)
                },
                { $set: { isRead: true } }
            );
            console.log(notification,'The notification')
            const recieverSocketId = getRecieverSocketId(sender)
                const notif = await NotificationModel.find({userId: sender})
                if(recieverSocketId && notif){
                    io.to(recieverSocketId).emit('notifications',notif)
                }
            return notification
        } catch (error: any) {
            throw new AppError(
                'FailedFetchNotificaiton',
                500,
                error.message || 'Error fetching Notification'
            )
        }
    }

    static async getWorkHistory(id: string){
        try {
            console.log(id,' here in repository')
            const data = await ContractSchema.find({$or: [
              { freelancerId: id },
              { clientId: id },
            ],
            status: { $in: ['completed'] },
          })
            .populate('clientId') 
            .populate('jobId') 
            .lean();
      
            console.log(data,'the work history data')
      
            return data
          } catch (error: any) {
            throw new AppError('FailedUpdatingProfile',500,error.message || 'Failed to get work history')
      
          }
    }

    static async checkContract(userId: string, freelancerId: string){
        try {
            const contract = await ContractSchema.find({clientId: userId, freelancerId: freelancerId})
            console.log(contract)
            return contract
        } catch (error: any) {
            throw new AppError('FailedToFetchContract',HTTP_statusCode.InternalServerError, error.message || 'Failed to fetch contract details')
        }
    }

    static async addRatingAndReview(data: {clientId: string, freelancerId: string, rating: Number, review: string}){
        try {
            const ratingReview = await ReviewSchema.create(data)
            return ratingReview
        } catch (error: any) {
            throw new AppError('FailedToAddRatingReview',
                 HTTP_statusCode.InternalServerError,
                 error.message || 'Failed to add rating and review')
        }
    }

    static async getReviews(id: string){
        try {
            const data = await ReviewSchema.find({freelancerId: id})
            if(!data){
                throw AppError.notFound('No rating have been found')
            }else{
                return data
            }
        } catch (error: any) {
            throw new AppError('FailedFetchRatingReview',
                HTTP_statusCode.InternalServerError,
                error.message || 'Failed to get rating and review')
        }
    }

    static async getSkills(){
        try {
            const skills = await SkillSchema.find().populate('category')
            return skills
        } catch (error: any) {
            throw new AppError('FailedFetchSkills',
                HTTP_statusCode.InternalServerError,
                error.message || 'Failed to get rating and review')
        }
    }

    static async getFreelancersList(id: string){
        try {
            const freelancers = await FreelancerApplication.find({status: 'accepted', userId: { $ne: id } }).populate('skills')
            return freelancers
        } catch (error: any) {
            throw new AppError('FailedFetchSkills',
                HTTP_statusCode.InternalServerError,
                error.message || 'Failed to get rating and review')
        }
    }

    static async updateUserInfo (id: string, updatedData: { name?: string; phone?: string }){
        try {

            const updatedUser = await userModel.findByIdAndUpdate(
                id,
                { $set: updatedData }, 
                { new: true }
            );
    
            if (!updatedUser) {
                throw AppError.notFound('User not found');
            }
    
            return updatedUser;
        } catch (error: any) {
            throw new AppError('FailedUpdateProfile',
                HTTP_statusCode.InternalServerError,
                error.message || 'Failed to update profile')
        
        }
    };
    
}