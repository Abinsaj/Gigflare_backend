import { Request, Response } from "express";
import HTTP_statusCode from "../Enums/httpStatusCode";
import { FreelancerService } from "../Services/freelancerServices";
import { HttpRequest } from "aws-sdk";
import { FreelancerRepository } from "../Repository/freelancerRepository";


export class FreelancerController {
    private freelancerService: FreelancerService
    constructor(freelancerService: FreelancerService) {
        this.freelancerService = freelancerService
    }

    verifyApplication = async (req: Request, res: Response): Promise<void> => {

        try {
            const {userId} = req.params
            const files = (req as any).files as {
                [fieldname: string]: Express.Multer.File[]
            }

            if (files) {
                console.log("Uploaded files:", files);
            } else {
                console.log("No files uploaded.");
            }

            const data = req.body

            data.skills = JSON.parse(data.skills);
            data.experience = JSON.parse(data.experience);
            data.education = JSON.parse(data.education);

            if (files['photo']) {
                data.photo = files['photo'][0];
            }

            
            data.certification = data.certification.map((cert: any, index: number) => {
                const fileKey = `certification`;
                if (files[fileKey]) {
                    cert.file = files[fileKey][0];
                }
                
                return cert;
            });

            await this.freelancerService.freelancerApplicationService(files, data, userId);
            res.status(HTTP_statusCode.OK).json({successs:true, message: 'Applicaiton submitted successfully'})
        } catch (error: any) {
            console.error("Error in tutor application controller:", error);
            res
                .status(HTTP_statusCode.InternalServerError)
                .json({ success: false, message: error.message || 'Internal Server Error' });
        }
    }

    getSingleDetails = async(req: Request, res: Response)=>{
        try {
            console.log('its here')
            const {id} = req.params
            console.log(id)
            const data = await this.freelancerService.getSingleDetailService(id)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json(error.message)
        }
    }

    getJobDetails = async(req: Request, res: Response)=>{
        try {
            const data = await FreelancerRepository.getJobs()
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json('Internal server Error')
        }
    }
}
