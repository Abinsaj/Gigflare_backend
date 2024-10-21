import FreelancerApplication, { IFreelancer } from "../Models/applicationSchema";
import userModel from "../Models/userSchema";


export class FreelancerRepository {
  static async saveApplication(data: any): Promise<IFreelancer> {
    try {      
      console.log(data)
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
      
      console.log('Freelancer Application saved successfully:', savedApplication._id);
      return savedApplication;
      
    } catch (error: any) {
      console.error('Error saving freelancer application:', error);
      throw new Error(error.message || 'Error saving freelancer application');
    }
  }

  static async getFreelancerApplications(){
    try {
        console.log('its herer in freelancer repository')
        const freelancer = await FreelancerApplication.find().sort({createdAt:-1})
        if(!freelancer){
            throw new Error('No freelancers have found')
        }
        console.log(freelancer)
        return freelancer
    } catch (error) {
        throw error
    }
  }

  static async updateStatus(applicationId: string, status: string) {
    try {
      console.log('finally it reached here');
      console.log(status, 'this is the status')
      const updatedApplication = await FreelancerApplication.findOneAndUpdate(
        { applicationId },
        { $set: { status: status } },
        { new: true }  
      );
  
      if (!updatedApplication) {
        console.log('Application not found');
        return false;
      }
  
      console.log(updatedApplication, 'this is the updated data');
  
      if (status === 'accepted') {
        console.log('Status is accepted, updating user');
        const user = await userModel.findOne({ email: updatedApplication.email });
        if (user) {
          user.isFreelancer = true;
          user.freelancerCredentials = {
            email: updatedApplication.email,
            uniqueID: updatedApplication.applicationId
          };
          await user.save();
          console.log('User updated:', user);
        }
      }
  
      return true;
    } catch (error: any) {
      console.error('Error in updateStatus:', error);
      throw new Error(error);
    }
  }
  


}