import { AwsConfig } from "../Config/awsFileConfig";
import FreelancerApplication, { IFreelancer } from "../Models/applicationSchema";
import jobModel from "../Models/jobSchema";
import userModel from "../Models/userSchema";

const aws = new AwsConfig()

export class FreelancerRepository {



  static async saveApplication(data: any): Promise<IFreelancer> {
    try {  
      console.log(data,'this is the data in the application repository')    
      const user = await userModel.findOne({ userId: data.userId });
      if (!user) {
        throw new Error('User not found');
      }

      const isApplicatinExist = await FreelancerApplication.findOne({userId:data.userId})
      if(isApplicatinExist){
        throw new Error('You have already applied for freelancer')
      }
      const application = new FreelancerApplication(data);
      const savedApplication = await application.save();
      
      return savedApplication;
      
    } catch (error: any) {
      console.error('Error saving freelancer application:', error);
      throw new Error(error.message || 'Error saving freelancer application');
    }
  }

  static async getFreelancerApplications(){
    try {
        const freelancer = await FreelancerApplication.find().sort({createdAt:-1})
        if(!freelancer){
            throw new Error('No freelancers have found')
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
      console.log(updatedApplication,'this is the updated application')
      if (!updatedApplication) {
        return false;
      }
  
      if (status === 'accepted') {
        const user = await userModel.findOne({ email: updatedApplication.email });
        // let profileUrl = ''
        // if(user?.profile){
        //   profileUrl = await aws.getFile(user.profile as string, `user/profile/${user.userId}`)
        //   console.log(profileUrl,'this is the profile url')
        // }
        if (user) {
          user.isFreelancer = true;
          
          user.freelancerCredentials = {
            email: updatedApplication.email,
            uniqueID: updatedApplication.applicationId
          };
          await user.save();
        }
        return user;
      }
      return updatedApplication
    } catch (error: any) {
      console.error('Error in updateStatus:', error);
      throw new Error(error);
    }
  }
  
  static async getFreelancerDetail(id: string){
    try {
      const data = await FreelancerApplication.findOne({userId:id})
      return data
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  static async getJobs(){
    try {
      const data = await jobModel.find({})
      return data
    } catch (error: any) { 
      throw new Error( error.message || 'Internal server error')
    } 
  }


}