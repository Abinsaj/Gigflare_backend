import { AwsConfig } from "../Config/awsFileConfig"
import { IFreelancer } from "../Models/applicationSchema"
import { v4 as uuidv4 } from "uuid";
import { FreelancerRepository } from "../Repository/freelancerRepository";


require('dotenv').config();



export class FreelancerService{

    private awsConfig = new AwsConfig()


    freelancerApplicationService = async(files: any, data: any ,userId: string): Promise<void>=>{
        try {
            const bucketName = process.env.BUCKET_NAME
            const fileUrls: { type: string; url: string }[] = [];
            let photoUrl 
            if(files.photo){
                photoUrl = await this.awsConfig.uploadFile(
                    'freelancerApplication/photo/',
                    files.photo[0]
                );    
            }
            
            let certficateUrl = []
            if(files.certification){
                for(const certificate of files.certification){
                    let certficate = await this.awsConfig.uploadFile(
                        'freelancerApplication/certification/',
                            certificate
                        );
                        certficateUrl.push(certficate)
                    console.log(certficate,'this is the certification url')
                }
            }
            let photo = {
                fileurl: photoUrl
            }
            data.photo = photo
            data.certficatImage = certficateUrl
            const applicationId = uuidv4()

            const appData = {
                userId,
                applicationId,
                ...data
            };

            const freelancerData = await FreelancerRepository.saveApplication(appData as any)
            console.log(freelancerData);
        } catch (error: any) {
            throw new Error(error.message || 'An error occured while processing the application');
        }
    }

    getSingleDetailService = async(id: string)=>{
        try {
            const data = await FreelancerRepository.getFreelancerDetail(id)
            if(!data){
                throw new Error('No data have been found')
            }
            const image = await this.awsConfig.getFile('freelancerApplication/photo',data?.photo?.fileurl)
            let certificateImg = ''
            for(let image of data?.certficatImage!){
                certificateImg = await this.awsConfig.getFile('freelancerApplication/certification',image)
            }

            const freelancerData = {
                userId: data!.userId,
                    applicationId: data!.applicationId,
                    firstName: data!.firstName,
                    lastName: data!.lastName,
                    profile: image,
                    description: data!.description,
                    language: data!.language,
                    experience: data!.experience,
                    skills: data!.skills,
                    education: data!.education,
                    certification: data!.certification,
                    certificateImage: certificateImg,
                    portfolio: data!.portfolio,
                    email: data!.email,
                    phone: data!.phone
            }
            return freelancerData
        } catch (error: any) {
            throw new Error(error.message)
        }
    }
}