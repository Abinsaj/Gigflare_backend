import { AwsConfig } from "../Config/awsFileConfig";
import FreelancerApplication, { IFreelancer } from "../Models/applicationSchema";
import CategorySchema from "../Models/categorySchema";
import jobModel from "../Models/jobSchema";
import ProposalModel, { IProposal } from "../Models/proposalSchema";
import userModel from "../Models/userSchema";
import sentApplicationMail from "../Config/rejectionEmailConfig";
import jobOfferModel from "../Models/jobOfferSchema";
import AppError from "../utils/AppError";
import ContractSchema from "../Models/contractSchema";
import { ObjectId } from "mongoose";

const aws = new AwsConfig()

export class FreelancerRepository {

  static async saveApplication(data: any): Promise<IFreelancer> {
    try {

      const user = await userModel.findOne({ _id: data.userId });
      if (!user) {
        throw AppError.notFound('User not found')
      }

      const isApplicatinExist = await FreelancerApplication.findOne({ userId: data.userId })
      if (isApplicatinExist) {

        throw  AppError.conflict('You have already applied for freelancer')
      }else{

        const application = new FreelancerApplication(data);
      const savedApplication = await application.save();
      if(!savedApplication){
        throw AppError.conflict('Failed to save freelancer application')
      }
      return savedApplication;
      }
    } catch (error: any) {
      if(error instanceof AppError){
        throw error
      }
      throw new AppError('ApplicationSave Error',500,error.message || 'Error saving freelancer application');
    }
  }

  static async getFreelancerApplications() {
    try {
      const freelancer = await FreelancerApplication.find().sort({ createdAt: -1 })
      if (!freelancer) {
        throw  AppError.conflict('No freelancers have found')
      }

      return freelancer
    } catch (error) {
      throw error
    }
  }

  static async updateStatus(applicationId: string, status: string) {
    try {
      const updatedApplication = await FreelancerApplication.findOneAndUpdate(
        { applicationId },
        { $set: { status: status } },
        { new: true }
      );
      console.log(updatedApplication, 'this is the updated application')
      if (!updatedApplication) {
        return false;
      }


      const user = await userModel.findOne({ email: updatedApplication.email });

      if (user) {
        if (updatedApplication.status === 'accepted') {
          const mailresult = await sentApplicationMail(user.email, 'accepted')
          console.log(mailresult)
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

  static async getFreelancerDetail(id: string) {
    try {
      if(!id){
        throw AppError.badRequest('User ID is required')
      }
      const data = await FreelancerApplication.findOne({ userId: id })
      if(!data){
        throw AppError.notFound('No freelancer details have found')
      }
      return data
    } catch (error: any) {
      if(error instanceof AppError){
        throw error
      }
      throw new AppError('DetailRetrievalError',500,error.message)
    }
  }

  static async getJobs(id: string) {
    try {
      const data = await jobModel.find({ createdBy: { $ne: id } });
      console.log(data,'this is the data')
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Internal server error');
    }
  }
  

  static async getSingleCategory(name: string) {
    try {
      const data = await CategorySchema.findOne({ name: name })
      console.log(data)
      return data
    } catch (error) {
      console.log(error)
    }
  }

  static async getSingleJobData(_id: string) {
    try {
      const data = await jobModel.findById({ _id })
      return data
    } catch (error) {
      console.log(error)
    }
  }

  static async createJobProposal(data: any) {
    try {
      console.log(data, 'the data need to be created is this')
      const newProposal = new ProposalModel(data)
      return await newProposal.save()
    } catch (error: any) {
      console.log(error)
      throw new Error(error)
    }
  }

  static async getProposals(freelancerId: string) {
    try {
      console.log(freelancerId, 'Fetching proposal data...');
      const data = await ProposalModel.find({ freelancerId: freelancerId })
        .populate('jobId', 'title description skillsRequired budget category duration projectType experienceLevel status createdBy');
      return data;
    } catch (error: any) {
      console.error('Error fetching proposals:', error);
      throw new Error(error);
    }
  }

  static async getJobOfferData(freelancerId: string){
      try {
        console.log(freelancerId,' this si the id we got')
        const data = await jobOfferModel.find({freelancerId}).populate('jobId')
        return data
      } catch (error: any) {
        throw new Error(error)
      }
  }

  static async changeOfferStatus(data:any){
    try {
      const _id = data._id
      console.log(data.status,'shiyldgjlf')
      const offerData = await jobOfferModel.findByIdAndUpdate({_id:_id},
        {
          $set:{status: data.status}
        },
        {
          new:true
        }
      )
      console.log(offerData)
      if(!offerData){
        throw AppError.notFound('No offer data have been found')
      }
      return offerData
    } catch (error: any) {
      console.log(error)
      if(error instanceof AppError){
        throw error
      }
      throw new AppError('JobStatusChangeFailed',
        500,
        error.message || 'An unexpected error has occured'
      )
    }
  }

  static async getContracts(freelancerId: string){
    try {
      console.log(freelancerId,' we got the id here')
      const data = await ContractSchema.find({freelancerId})
      .populate('freelancerId')
      .populate('clientId')
      .populate('jobId')
      console.log(data)
      return data
    } catch (error: any) {
      throw new AppError('FetchContractDetailsFailed',
        500,
        error.message || 'An unexpected error has occured'
      )
    }
  }

  static async getContractDetails(userId: ObjectId, contractId: ObjectId) {
    try {
      
        const contract = await ContractSchema.findOne({
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
      if(error instanceof AppError){
        throw error
      }
        console.error('Error fetching contract details:', error.message);
        throw new AppError('FaieldFetchData',500,error.message || 'Failed to fetch contract details');
    }
}

}