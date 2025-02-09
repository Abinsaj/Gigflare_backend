import { AwsConfig } from "../Config/awsFileConfig";
// import FreelancerApplication, { IFreelancer } from "../Models/applicationSchema";
import IJob, { ICategory, IContract, IFreelancer, IJobOffer, INotification, IProposal, IReview, ISkill } from "../Interfaces/common.interface";
// import CategorySchema from "../Models/categorySchema";
// import jobModel from "../Models/jobSchema";
// import ProposalModel, { IProposal } from "../Models/proposalSchema";
import userModel from "../Models/userSchema";
// import sentApplicationMail from "../Config/rejectionEmailConfig";
// import jobOfferModel from "../Models/jobOfferSchema";
import AppError from "../utils/AppError";
import ContractSchema from "../Models/contractSchema";
import { Model, ObjectId } from "mongoose";
// import NotificationModel from "../Models/notificationSchema";
// import SkillSchema from "../Models/skillSchema";
// import ReviewSchema from "../Models/reviewSchema";
import { IFreelancerRepository } from "../Interfaces/FreelancerInterface/freelancer.repository.interface";
import { BaseRepository } from "./baseRepository";
import jobModel from "../Models/jobSchema";
import { getRecieverSocketId,io } from "../server";

const aws = new AwsConfig()

export class FreelancerRepository implements IFreelancerRepository {

  private categoryRepo: BaseRepository<ICategory>
  private freelancerRepo: BaseRepository<IFreelancer>
  private jobRepo: BaseRepository<IJob>
  private proposalRepo: BaseRepository<IProposal>
  private jobofferRepo: BaseRepository<IJobOffer>
  private contractRepo: BaseRepository<IContract>
  private notificationRepo: BaseRepository<INotification>
  private skillRepo: BaseRepository<ISkill>
  private reviewRepo: BaseRepository<IReview>

  constructor(
    categorySchema: Model<ICategory>,
    freelancerSchema: Model<IFreelancer>,
    jobSchema: Model<IJob>,
    proposalSchema: Model<IProposal>,
    jobofferSchema: Model<IJobOffer>,
    contractRepo: Model<IContract>,
    notificationRepo: Model<INotification>,
    skillRepo: Model<ISkill>,
    reviweRepo: Model<IReview>
  ) {
    this.categoryRepo = new BaseRepository(categorySchema)
    this.freelancerRepo = new BaseRepository(freelancerSchema)
    this.jobRepo = new BaseRepository(jobSchema)
    this.proposalRepo = new BaseRepository(proposalSchema)
    this.jobofferRepo = new BaseRepository(jobofferSchema)
    this.contractRepo = new BaseRepository(contractRepo)
    this.notificationRepo = new BaseRepository(notificationRepo)
    this.skillRepo = new BaseRepository(skillRepo)
    this.reviewRepo = new BaseRepository(reviweRepo)
  }

  saveApplication = async (data: any): Promise<IFreelancer> => {
    try {

      const user = await userModel.findOne({ _id: data.userId });
      if (!user) {
        throw AppError.notFound('User not found')
      }

      const isApplicatinExist = await this.freelancerRepo.find({ userId: data.userId })
      if (isApplicatinExist && isApplicatinExist.status == 'pending') {

        throw AppError.conflict('You have already applied for freelancer')
      } else {

        // const application = new FreelancerApplication(data);
        const savedApplication = await this.freelancerRepo.create(data)
        // const savedApplication = await application.save();
        if (!savedApplication) {
          throw AppError.conflict('Failed to save freelancer application')
        }
        return savedApplication;
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('ApplicationSave Error', 500, error.message || 'Error saving freelancer application');
    }
  }


  getFreelancerDetail = async (id: string) => {
    try {
      if (!id) {
        throw AppError.badRequest('User ID is required')
      }
      const data = await this.freelancerRepo.findOneAndPopulate({ userId: id }, ['skills'])
      if (!data) {
        throw AppError.notFound('No freelancer details have found')
      }
      return data
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('DetailRetrievalError', 500, error.message)
    }
  }

  getJobs = async (id: string) => {
    try {
      const data = await this.jobRepo.findAll({ createdBy: { $ne: id } }, 0, 0, ['skillsRequired', 'createdBy']);
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Internal server error');
    }
  }


  getSingleCategory = async (name: string) => {
    try {
      const data = await this.categoryRepo.find({ name: name })
      return data
    } catch (error) {
      console.log(error)
    }
  }

  getSingleJobData = async (_id: string) => {
    try {
      const data = await this.jobRepo.find({ _id })
      return data
    } catch (error) {
      console.log(error)
    }
  }

  createJobProposal = async (data: any) => {
    try {
      // const newProposal = new ProposalModel(data)
      const newProposal = await this.proposalRepo.create(data)
      return newProposal
    } catch (error: any) {
      console.log(error)
      throw new Error(error)
    }
  }

  getProposals = async (freelancerId: string) => {
    try {
      const data = await this.proposalRepo.findAll({ freelancerId, status: 'approved' }, 0, 0, ['jobId']);
      return data;
    } catch (error: any) {
      console.error('Error fetching proposals:', error);
      throw new Error(error);
    }
  }

  getJobOfferData = async (freelancerId: string) => {
    try {
      const data = await this.jobofferRepo.findAll({ freelancerId }, 0, 0, ['jobId'])
      return data
    } catch (error: any) {
      throw new Error(error)
    }
  }

  changeOfferStatus = async (data: any) => {
    try {
      const _id = data._id
      const offerData = await this.jobofferRepo.updateAndReturn({ _id: _id },
        {
          $set: { status: data.status }
        },
        {
          new: true
        }
      )
      if (!offerData) {
        throw AppError.notFound('No offer data have been found')
      }
      return offerData
    } catch (error: any) {
      console.log(error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('JobStatusChangeFailed',
        500,
        error.message || 'An unexpected error has occured'
      )
    }
  }

  createContract = async (data: any) => {
    try {
      console.log(data,'these are the data that is passed from the service layer')
      const contract = await this.contractRepo.create(data)

      const userContractNotification = await this.notificationRepo.create({
        userId: data.clientId,
        type:'contract',
        message: 'New Contract',
        data:{
          client:data.clientId,
          freelancer: data.freelancerId
        }
      })

      const freelancerContractNotification = await this.notificationRepo.create({
        userId: data.freelancerId,
        type:'contract',
        message: 'New Contract',
        data:{
          client:data.clientId,
          freelancer: data.freelancerId
        }
      })

      const userSocketId = getRecieverSocketId(data.clientId)
      const freelancerSocketId = getRecieverSocketId(data.freelancerId)
      console.log(userSocketId,'fadfafadfadsg',freelancerSocketId,'these are the socket id of the user and freelancer')
      if(userSocketId && freelancerSocketId){
        io.to(userSocketId).emit('notification',userContractNotification)
        io.to(freelancerSocketId).emit('notification',freelancerContractNotification)
      }

      return contract
    } catch (error: any) {
      console.log(error)
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('FailedToCreateContract',
        500,
        error.message || 'An unexpected error has occured'
      )
    }
  }

  getContracts = async (freelancerId: string) => {
    try {
      const data = await ContractSchema.find({ freelancerId })
        .populate('freelancerId')
        .populate('clientId')
        .populate('jobId')
      return data
    } catch (error: any) {
      throw new AppError('FetchContractDetailsFailed',
        500,
        error.message || 'An unexpected error has occured'
      )
    }
  }

  getContractDetails = async (userId: ObjectId, contractId: ObjectId) => {
    try {

      const contract = await this.contractRepo.find({
        _id: contractId,
        $or: [
          { freelancerId: userId },
          { clientId: userId }
        ]
      });

      if (!contract) {
        throw AppError.notFound('Contract not found for the given user and contract ID');
      }

      return contract;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error fetching contract details:', error.message);
      throw new AppError('FaieldFetchData', 500, error.message || 'Failed to fetch contract details');
    }
  }

  deleteProposal = async (id: string) => {
    try {
      const proposal = await this.proposalRepo.findOneAndDeleteAlternative({ _id: id })
      if (!proposal) {
        return { success: false, message: 'proposal not found' }
      }
      return { success: true, message: "Proposal deleted successfully", data: proposal };
    } catch (error) {
      console.log(error)
      return { success: false, message: "An error occurred while deleting the proposal", error };
    }
  }

  getFreelancerNotification = async (id: string) => {
    try {
      const notification = await this.notificationRepo.findAll({ userId: id }, 0, 0)
      return notification
    } catch (error: any) {
      throw new AppError('FailedFetchNotification', 500, error.message || 'Failed to Fetch Notification')
    }
  }

  updateFreelancerProfile = async (id: string, data: any) => {
    try {
      const updatedProfile = await this.freelancerRepo.updateAndReturn({ _id: id },
        { ...data },
        { new: true }
      )
      return updatedProfile
    } catch (error: any) {
      throw new AppError('FailedUpdatingProfile', 500, error.message || 'Failed to update data')
    }
  }

  getWorkHistory = async (id: string) => {
    try {
      const data = await this.contractRepo.findAll({
        $or: [
          { freelancerId: id },
          { clientId: id },
        ],
        status: { $in: ['completed'] },
      }, 0, 0, ['freelancerId', 'clientId', 'jobId'])

      return data
    } catch (error: any) {
      throw new AppError('FailedUpdatingProfile', 500, error.message || 'Failed to get work history')

    }
  }

  getSkills = async (id: string) => {
    try {
      const data = await this.skillRepo.findAll({ category: id },0,0)
      return data
    } catch (error: any) {
      throw new AppError('FailedToFetchSkills', 500, error.message || 'Failed to fetch skills')
    }
  }

  getFilteredJob = async(filter: any) => {
    try {
      // const data = await this.jobRepo.findAll(filter,0,0,['skillRequired','createdBy'])
      const data = await jobModel.find(filter).populate('skillsRequired').populate('createdBy')
      return data
    } catch (error: any) {
      throw new AppError('FailedToFetchFilteredData', 500, error.message || 'Failed to fetch skills')
    }
  }

  getRecentContracts = async(id: string) =>{
    try {
      const contracts = await this.contractRepo.findAll(
        {
          freelancerId: id,
          status: { $in: ['active', 'submitted', 'completed'] }
        },0,10,['jobId']
      );
      return contracts;
    } catch (error: any) {
      throw new AppError('Failed to fetch recent contracts', 500, error.message || 'An unexpected error occurred');
    }
  }
  getReviewRating = async(id: string)=> {
    try {
      const reveiw = await this.reviewRepo.findAll(
        {
          freelancerId: id
        },0,0,['clientId','freelancerId']
      )

      return reveiw
    } catch (error: any) {
      throw new AppError('Failed to fetch reviews', 500, error.message || 'An unexpected error occurred');
    }
  }

  // static async getReviews(id: string){
  //   try {
  //     console.log('its getting inside of the repository')
  //     const review = await ReviewSchema.find({freelancerId:id}).populate('clientId').populate('freelancerId')
  //     console.log(review,'this is the reviews we got in freelancer respository')
  //     return review
  //   } catch (error: any) {
  //     throw new AppError('Failed to fetch reviews', 500, error.message || 'An unexpected error occurred');
  //   }
  // }

}