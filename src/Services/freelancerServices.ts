import { AwsConfig } from "../Config/awsFileConfig"
import { IFreelancer } from "../Models/applicationForm"
import { v4 as uuidv4 } from "uuid";
import { FreelancerRepository } from "../Repository/freelancerRepository";


require('dotenv').config()

export class FreelancerService{

    private awsConfig = new AwsConfig()

    freelancerApplicationService = async(files: any, data: any ): Promise<void>=>{
        try {
            const bucketName = process.env.BUCKET_NAME

            const fileUrls: { type: string; url: string }[] = [];
            if(files.photo){
                const url = await this.awsConfig.uploadFile(
                    'freelancerApplication/photo',
                    files.photo[0]
                );
                fileUrls.push({type:'photo',url});
            }

            if(files.certification){
                for(const certificate of files.certification){
                    const url = await this.awsConfig.uploadFile(
                        'freelancerApplication/certification',
                        certificate
                    );
                    fileUrls.push({type:'certification',url});
                }
            }

            const applicationId = uuidv4()
            const wholeData = {
                applicationId,
                ...data,
                files:fileUrls
            };

            const freelancerData = await FreelancerRepository.saveApplication(wholeData as any)
            console.log(freelancerData);
        } catch (error: any) {
            throw new Error(error.message || 'An error occured while processing the application');
        }
    }
}