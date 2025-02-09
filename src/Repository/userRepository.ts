import e, { application } from "express";
import IJob, { ICategory, IContract, IFreelancer, IJobOffer, INotification, IProposal, IReview, ISkill, IUser } from "../Interfaces/common.interface";
import FreelancerApplication from "../Models/applicationSchema";
import jobModel from "../Models/jobSchema";
import userModel from "../Models/userSchema";
import bcrypt from 'bcrypt'
import CategorySchema from "../Models/categorySchema";
import ProposalModel from "../Models/proposalSchema";
import mongoose, { Model, ObjectId } from "mongoose";
import jobOfferModel from "../Models/jobOfferSchema";
import ContractSchema from "../Models/contractSchema";
import AppError from "../utils/AppError";
import { getRecieverSocketId, io } from "../server";
import NotificationModel from "../Models/notificationSchema";
import HTTP_statusCode from "../Enums/httpStatusCode";
import ReviewSchema from "../Models/reviewSchema";
import SkillSchema from "../Models/skillSchema";
import IUserRepository from "../Interfaces/UserInterface/user.repository.interface";
import { BaseRepository } from "./baseRepository";


export class UserRepository implements IUserRepository {

    private userRepo: BaseRepository<IUser>;
    private jobRepo: BaseRepository<IJob>;
    private freelancerRepo: BaseRepository<IFreelancer>
    private categoryRepo: BaseRepository<ICategory>
    private proposalRepo: BaseRepository<IProposal>
    private notificationRepo: BaseRepository<INotification>
    private contractRepo: BaseRepository<IContract>
    private reviewRepo: BaseRepository<IReview>
    private skillRepo: BaseRepository<ISkill>
    private offerRepo: BaseRepository<IJobOffer>
    constructor(
        userModel: Model<IUser>,
        jobModels: Model<IJob>,
        freelancerModel: Model<IFreelancer>,
        CategorySchema: Model<ICategory>,
        ProposalModels: Model<IProposal>,
        NotificationModel: Model<INotification>,
        contractSchema: Model<IContract>,
        reviewSchema: Model<IReview>,
        SkillSchema: Model<ISkill>,
        offerSchema: Model<IJobOffer>
    ){
        this.userRepo = new BaseRepository(userModel)
        this.jobRepo = new BaseRepository(jobModels)
        this.freelancerRepo = new BaseRepository(freelancerModel) 
        this.categoryRepo = new BaseRepository(CategorySchema)
        this.proposalRepo = new BaseRepository(ProposalModels)
        this.notificationRepo = new BaseRepository(NotificationModel)
        this.contractRepo = new BaseRepository(contractSchema)
        this.reviewRepo = new BaseRepository(reviewSchema)
        this.skillRepo = new BaseRepository(SkillSchema)
        this.offerRepo = new BaseRepository(offerSchema)
    }
    existUser = async(email: string): Promise<IUser | null>=> {
        try {
            const existUser = await this.userRepo.find({email});
            return existUser;
        } catch (error:any) {
            throw new Error('Database query failed');
        };
    }

    
    createUser = async(userData: any): Promise<IUser>=>{
        try {
            return await this.userRepo.create(userData)
        } catch (error: any) {
            console.log('Error in creating new user');
            throw new Error (`Error in creating user : ${error.message}`,)
        }
    }
    verifyLogin = async(email: string, password: string): Promise<IUser | null>=>{
        try {
            const user = await this.userRepo.find(
                {email:email}
            )
            return user
        } catch (error) {
            throw new Error('verify login failed')
        }
    }

    getUsers = async()=>{
        try {
            const users = await this.userRepo.find({})
            return users
        } catch (error) {
            throw new Error('failed to fetch users list from the db')
        }
    }

    verifyEmail = async(email: string)=>{
        try {
            const user = await this.userRepo.find({email})

            if(!user){
                return false
            }else{
                return true
            }
        } catch (error) {
            throw new Error('error verifying the email')
        }
    }

    changePassword = async(password: string, email: string | null)=>{
        try {
            const user = await this.userRepo.updateAndReturn(
                {email:email},
                {password: password},
                {new: true}
            )
            if(!user){
                throw new Error('User not found')
            }
            return user
        } catch (error) {
            throw new Error('Database Operation Failed')
        }
    }

    createJob = async(data: any)=>{
        try {
            return await this.jobRepo.create(data)
        } catch (error:any) {
            throw new Error(error.message)
        }
    }

    addAddress = async(data: any, id: string)=>{
        try {
            const user = await this.userRepo.updateAndReturn({userId:id},
                {$push: {
                    address: data
                }},
                {new: true}
            )
            return user
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    getUserInfo = async(_id: string) => {
        try {
            const userData = await this.userRepo.find({_id:_id})  
            return userData
        } catch (error) {
            throw new Error('An unexpected error has occured')
        }
    }

    getFreelancerDetails = async(id: any, page: any, limit: any)=>{
        try {
            const pageNumber = Math.max(1, page); 
            const pageLimit = Math.max(1, limit);
            const skip = (pageNumber - 1)* pageLimit
            const query = {status:'accepted',userId:{ $ne: id }}
            const data = await this.freelancerRepo.findAll(query, pageLimit, skip,['skills'])
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

    userChangePassword = async(password: string, _id: string)=>{
        try {
            const data = await this.userRepo.updateAndReturn(
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

    // static async findByEmail(email:string){
    //     try {
    //         const data = await userModel.findOne({email:email})
    //         return data
    //     } catch (error) {
    //         console.log(error)
    //     }
    // }

    // static async saveUser(user:IUser){
    //     try {
    //         const newUser = new userModel(user)
    //         await newUser.save()
    //         return newUser
    //     } catch (error) {
    //         console.log(error)
    //         return null
    //     }
    // }

    getUserJob = async(_id: any, page: any, limit: any)=>{
        try {
            const query = {createdBy: _id}
            const skip = (page-1)*limit
            const jobData = await jobModel.find(query).skip((page-1)*limit).limit(limit)
            const totalItems = await this.jobRepo.countDoc({createdBy:_id});
            const totalPages = Math.ceil(totalItems / limit);
            if(!jobData){
                throw new Error('No data have been found')
            }
            return {jobData,totalPages}
        } catch (error: any) {
            throw new AppError('FailedFetchJobs',
                HTTP_statusCode.InternalServerError,
                error.message || 'Failed to get rating and review')
        }
    }

    getCategories= async()=>{
        try {
            const catData = await this.categoryRepo.findAll({})
            if(!catData){
                throw new Error('No data have been found')
            }
            return catData
        } catch (error) {
            console.log(error)
        }
    }

    getProposals = async(jobId: string)=>{
        try {
            const proposalData = await ProposalModel.find({jobId: jobId }).lean()
            return proposalData
        } catch (error) {
            console.log(error)
        }
    }

    getFreelancers = async(id:ObjectId[])=>{
        try {
            // const data = await this.freelancerRepo.findAll({_id:{$in:id}})
            const data = await FreelancerApplication.find({_id:{$in:id}}).populate('skills').lean()
            return data
        } catch (error) {
            console.log(error) 
        }
    }

    approveProposal = async(id: string, status: 'rejected' | 'approved')=>{
        try {
            const data = await this.proposalRepo.updateAndReturn({_id: id},
                {
                    $set:{status:status}
                },
                {
                    new: true
                }
            )
            return data
        } catch (error) {
            throw error
        }
    }

    getJobOffer = async(offerData: any,jobId: string, freelancerId: string, userId: string)=>{
        try {
            console.log(offerData,'this is the offer Data')
            console.log(jobId, freelancerId, userId,'this is the job id')
            const data = await this.offerRepo.find({freelancerId: freelancerId})
            if(data){
                return {success: false}
            }else{

                const freelancerData = await this.freelancerRepo.find({_id:freelancerId})
                const otherId = freelancerData?.userId

                const data = {
                    clientId: userId ,
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

                const newData = await this.offerRepo.create(data)
                console.log(newData,' this is the data of the data of the data')
                const offerNotification = await this.notificationRepo.create({
                    userId:otherId,
                    type: 'offer',
                    message:'You got an Job offer',
                    data: {
                        senderId: userId,
                        receiverId: freelancerId,
                    },
                })

                const recieverSocketId = getRecieverSocketId(otherId)
                if(recieverSocketId){
                    io.to(recieverSocketId).emit('notifications',offerNotification)
                    io.to(recieverSocketId).emit('newOffer',offerNotification)
                }

                //  await  newData.save()
                 return {success:true}
                
            }
        } catch (error: any) {
            throw new AppError('FailedFetchSkills',
                HTTP_statusCode.InternalServerError,
                error.message || 'Failed to get rating and review')
        }
    }

    getContracts = async(clientId: string)=>{
        try {
            const data = await this.contractRepo.findAll({
                $or: [
                    { clientId }, 
                    { freelancerId: clientId }
                ]
            },0,0,['jobId','freelancerId','clientId'])
           
            
            return data
        } catch (error: any) {
            throw new AppError('FetchContractDetailError',
                500,
                error.message || 'An unexpected error occured'
            )
        }
    }

    getContractDetails = async(userId: ObjectId, contractId: ObjectId)=>{
        try {
            const contract = await this.contractRepo.find({
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

    getSingleContract = async(id: ObjectId)=>{
        try {
            const data = await this.contractRepo.findOneAndPopulate({_id:id},['jobId','freelancerId','clientId'])
            return data
        } catch (error: any) {
            throw new AppError('FetchContractFailed',
                500,
                error.message || 'Error fetching contract'
            )
        }
    }

    getNotification = async(id: string)=>{
        try {
            const notification = await this.notificationRepo.findAll({userId:id},0,0)
            return notification
        } catch (error: any) {
            throw new AppError(
                'FailedFetchNotificaiton',
                500,
                error.message || 'Error fetching Notification'
            )
        }
    }

    changeNotificationStatus = async(id: string, type: 'proposal' | 'message' | 'offer' | 'contract')=>{
        try {
            let notification
            if(type == 'proposal'){
                notification = await this.notificationRepo.updateManyReturn({userId:id, type: type},
                    {$set: { isRead: true}}
                )
                const recieverSocketId = getRecieverSocketId(id)
                const notif = await this.notificationRepo.find({userId: id})
                if(recieverSocketId && notif){
                    io.to(recieverSocketId).emit('notifications',notif)
                }
                return notification

            }
            if(type == 'offer'){
                notification = await this.notificationRepo.updateManyReturn({userId:id, type: type},
                    {$set: { isRead: true}}
                )
                const recieverSocketId = getRecieverSocketId(id)
                const notif = await this.notificationRepo.find({userId: id})
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

    messageNotificationChange = async(sender: string, receiver: string)=>{
        try {
            const notification = await this.notificationRepo.updateManyReturn(
                {
                    userId: sender,
                    type: 'message',
                    'data.sender': new mongoose.Types.ObjectId(receiver),
                    'data.receiver': new mongoose.Types.ObjectId(sender)
                },
                { $set: { isRead: true } }
            );
            const recieverSocketId = getRecieverSocketId(sender)
                const notif = await this.notificationRepo.find({userId: sender})
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

    getWorkHistory = async(id: string)=>{
        try {
            const data = await ContractSchema.find({$or: [
              { freelancerId: id },
              { clientId: id },
            ],
            status: { $in: ['completed'] },
          }).populate('clientId').populate('jobId').populate('freelancerId').lean()
            
            return data
          } catch (error: any) {
            throw new AppError('FailedUpdatingProfile',500,error.message || 'Failed to get work history')
      
          }
    }

    checkContract = async(userId: string, freelancerId: string)=>{
        try {
            const contract = await this.contractRepo.findAll({clientId: userId, freelancerId: freelancerId},0,0)
            return contract
        } catch (error: any) {
            throw new AppError('FailedToFetchContract',HTTP_statusCode.InternalServerError, error.message || 'Failed to fetch contract details')
        }
    }

    addRatingAndReview = async(data: any)=>{
        try {
            const ratingReview = await this.reviewRepo.create(data)
            return ratingReview
        } catch (error: any) {
            throw new AppError('FailedToAddRatingReview',
                 HTTP_statusCode.InternalServerError,
                 error.message || 'Failed to add rating and review')
        }
    }

    getReviews = async(id: string)=>{
        try {
            const data = await this.reviewRepo.findAll({freelancerId: id},0,0) 
            const avgRating = await ReviewSchema.aggregate([
                {
                    $group: {
                        _id: "$freelancerId",
                        averageRating: { $avg: "$rating" }
                    }
                }
            ]);
            const rating = avgRating.map(({ _id, averageRating }) => ({
                freelancerId: _id,
                averageRating: averageRating.toFixed(2)
            }));
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

    getSkills = async()=>{
        try {
            const skills = await this.skillRepo.findAll({},0,0,['category'])
            return skills
        } catch (error: any) {
            throw new AppError('FailedFetchSkills',
                HTTP_statusCode.InternalServerError,
                error.message || 'Failed to get rating and review')
        }
    }

    getFreelancersList = async(id: string)=>{
        try {
            const freelancers = await this.freelancerRepo.findAll({status: 'accepted', userId: { $ne: id } },0,0,['skills'])
            return freelancers
        } catch (error: any) {
            throw new AppError('FailedFetchSkills',
                HTTP_statusCode.InternalServerError,
                error.message || 'Failed to get rating and review')
        }
    }

    updateUserInfo = async(id: string, updatedData: { name?: string; phone?: string })=>{
        try {

            const updatedUser = await this.userRepo.updateAndReturn(
                {id: id},
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