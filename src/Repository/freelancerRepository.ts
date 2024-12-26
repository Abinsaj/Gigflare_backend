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
import NotificationModel from "../Models/notificationSchema";
import SkillSchema from "../Models/skillSchema";
import ReviewSchema from "../Models/reviewSchema";

const aws = new AwsConfig()

export class FreelancerRepository {

  static async saveApplication(data: any): Promise<IFreelancer> {
    try {

      const user = await userModel.findOne({ _id: data.userId });
      if (!user) {
        throw AppError.notFound('User not found')
      }

      const isApplicatinExist = await FreelancerApplication.findOne({ userId: data.userId })
      if (isApplicatinExist && isApplicatinExist.status == 'pending') {

        throw AppError.conflict('You have already applied for freelancer')
      } else {

        const application = new FreelancerApplication(data);
        const savedApplication = await application.save();
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

  static async getFreelancerApplications() {
    try {
      const freelancer = await FreelancerApplication.find().sort({ createdAt: -1 })
      if (!freelancer) {
        throw AppError.conflict('No freelancers have found')
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
      if (!id) {
        throw AppError.badRequest('User ID is required')
      }
      const data = await FreelancerApplication.findOne({ userId: id }).populate('skills')
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

  static async getJobs(id: string) {
    try {
      const data = await jobModel.find({ createdBy: { $ne: id } }).populate('skillsRequired').populate('createdBy');
      console.log(data, 'this is the data')
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
      const data = await ProposalModel.find({ freelancerId, status: 'approved' })
        .populate('jobId');
      console.log(data, 'the proposal data in repository')
      return data;
    } catch (error: any) {
      console.error('Error fetching proposals:', error);
      throw new Error(error);
    }
  }

  static async getJobOfferData(freelancerId: string) {
    try {
      console.log(freelancerId, ' this si the id we got')
      const data = await jobOfferModel.find({ freelancerId }).populate('jobId')
      return data
    } catch (error: any) {
      throw new Error(error)
    }
  }

  static async changeOfferStatus(data: any) {
    try {
      const _id = data._id
      console.log(data.status, 'shiyldgjlf')
      const offerData = await jobOfferModel.findByIdAndUpdate({ _id: _id },
        {
          $set: { status: data.status }
        },
        {
          new: true
        }
      )
      console.log(offerData)
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

  static async getContracts(freelancerId: string) {
    try {
      console.log(freelancerId, ' we got the id here')
      const data = await ContractSchema.find({ freelancerId })
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
      if (error instanceof AppError) {
        throw error
      }
      console.error('Error fetching contract details:', error.message);
      throw new AppError('FaieldFetchData', 500, error.message || 'Failed to fetch contract details');
    }
  }

  static async deleteProposal(id: string) {
    try {
      const proposal = await ProposalModel.findOneAndDelete({ _id: id })
      if (!proposal) {
        return { success: false, message: 'proposal not found' }
      }
      return { success: true, message: "Proposal deleted successfully", data: proposal };
    } catch (error) {
      console.log(error)
      return { success: false, message: "An error occurred while deleting the proposal", error };
    }
  }

  static async getFreelancerNotification(id: string) {
    try {
      const notification = await NotificationModel.find({ userId: id })
      return notification
    } catch (error: any) {
      throw new AppError('FailedFetchNotification', 500, error.message || 'Failed to Fetch Notification')
    }
  }

  static async updateFreelancerProfile(id: string, data: any) {
    try {
      const updatedProfile = await FreelancerApplication.findByIdAndUpdate({ _id: id },
        { ...data },
        { new: true }
      )
      return updatedProfile
    } catch (error: any) {
      throw new AppError('FailedUpdatingProfile', 500, error.message || 'Failed to update data')
    }
  }

  static async getWorkHistory(id: string) {
    try {
      console.log(id, ' here in repository')
      const data = await ContractSchema.find({
        $or: [
          { freelancerId: id },
          { clientId: id },
        ],
        status: { $in: ['completed'] },
      })
        .populate('freelancerId')
        .populate('clientId')
        .populate('jobId')
        .lean();

      console.log(data, 'the work history data')

      return data
    } catch (error: any) {
      throw new AppError('FailedUpdatingProfile', 500, error.message || 'Failed to get work history')

    }
  }

  static async getSkills(id: string) {
    try {
      const data = await SkillSchema.find({ category: id })
      return data
    } catch (error: any) {
      throw new AppError('FailedToFetchSkills', 500, error.message || 'Failed to fetch skills')
    }
  }

  static async getFilteredJob(filter: any) {
    try {
      const data = await jobModel.find(filter).populate('skillsRequired').populate('createdBy')
      return data
    } catch (error: any) {
      throw new AppError('FailedToFetchFilteredData', 500, error.message || 'Failed to fetch skills')
    }
  }

  static async getRecentContracts(id: string) {
    try {
      const contracts = await ContractSchema.find(
        {
          freelancerId: id,
          status: { $in: ['active', 'submitted', 'completed'] }
        }
      )
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('jobId')

      return contracts;
    } catch (error: any) {
      throw new AppError('Failed to fetch recent contracts', 500, error.message || 'An unexpected error occurred');
    }
  }

  static async getReviewRating(id: string) {
    try {
      const reveiw = await ReviewSchema.find(
        {
          freelancerId: id
        }
      ).populate('clientId')

      return reveiw
    } catch (error: any) {
      throw new AppError('Failed to fetch reviews', 500, error.message || 'An unexpected error occurred');
    }
  }

  static async getReviews(id: string){
    try {
      console.log('its getting inside of the repository')
      const review = await ReviewSchema.find({freelancerId:id}).populate('clientId').populate('freelancerId')
      console.log(review,'this is the reviews we got in freelancer respository')
      return review
    } catch (error: any) {
      throw new AppError('Failed to fetch reviews', 500, error.message || 'An unexpected error occurred');
    }
  }

}