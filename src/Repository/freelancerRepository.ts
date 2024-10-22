import FreelancerApplication, { IFreelancer } from "../Models/applicationSchema";
import userModel from "../Models/userSchema";


export class FreelancerRepository {
  static async saveApplication(data: any): Promise<IFreelancer> {
    try {      
      const user = await userModel.findOne({ userId: data.userId });
      if (!user) {
        throw new Error('User not found');
      }

      const isApplicatinExist = await FreelancerApplication.findOne({userId: data.userId})
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
  
      if (!updatedApplication) {
        return false;
      }
  
      if (status === 'accepted') {
        const user = await userModel.findOne({ email: updatedApplication.email });
        if (user) {
          user.isFreelancer = true;
          user.freelancerCredentials = {
            email: updatedApplication.email,
            uniqueID: updatedApplication.applicationId
          };
          await user.save();
        }
      }
  
      return true;
    } catch (error: any) {
      console.error('Error in updateStatus:', error);
      throw new Error(error);
    }
  }
  


}