import { Request, Response } from "express";
import HTTP_statusCode from "../Enums/httpStatusCode";
import { FreelancerService } from "../Services/freelancerServices";
import { FreelancerRepository } from "../Repository/freelancerRepository";
import { HttpStatusCode } from "axios";
import AppError from "../utils/AppError";
import { UserRepository } from "../Repository/userRepository";


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
            console.log(data,'this is the lanuage')

            data.skills = JSON.parse(data.skills);
            data.language = JSON.parse(data.language)
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
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getSingleDetails = async(req: Request, res: Response)=>{
        try {
            console.log('its here')
            const {id} = req.params
            console.log(id)
            const data = await this.freelancerService.getSingleDetailService(id)
            console.log(data,'this is the data , i think the id will be here')
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json(error.message)
        }
    }

    getJobDetails = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            console.log(id,'this is the id we got')
            const data = await FreelancerRepository.getJobs(id)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json('Internal server Error')
        }
    }

    createProposals = async(req: Request, res: Response)=>{
        try {
            const { data, userId, jobId, freelancerId } = req.body
            const result = await this.freelancerService.createProposalService(data, userId, jobId, freelancerId)
            res.status(HTTP_statusCode.OK).json({success: true, message: 'Proposal Submitted successfully',result})
        } catch (error) {
            res.status(HttpStatusCode.InternalServerError).json(error)
        }
    }

    getProposals = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params;
            console.log(id,'the id we got in the freelancer controller')
            const data = await this.freelancerService.getProposalsService(id)
            res.status(HttpStatusCode.Ok).json(data)
        } catch (error) {
            res.status(HttpStatusCode.InternalServerError).json({ message:' An unexpected error has occur'})
        }
    }

    getJobOffers = async(req: Request, res: Response )=>{
        try {
            const {id} = req.params;
            const data = await FreelancerRepository.getJobOfferData(id)
            console.log(data,' we got the data here in controller')
            if(data !== null){
                res.status(HTTP_statusCode.OK).json(data)
            }
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json({message:'An Error occured'})
        }
    }

    acceptRejectOffer = async(req: Request, res: Response)=>{
        try {
            console.log('Data from Frontend', req.body)
            const {data} = req.body
            const result = await this.freelancerService.acceptOfferService(data)
            if(result){
                res.status(HTTP_statusCode.OK).json({success: true, message:'Job accepted and contract has been generated'})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getContracts = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const data = await this.freelancerService.getContractService(id)
            res.status(HTTP_statusCode.OK).json({data})
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    signContract = async(req: Request, res: Response)=>{
        try {
            console.log('its here', req.body)
            const {hash, contractId, freelancerId} = req.body
            const result = await this.freelancerService.signContractService(hash, contractId, freelancerId)
            if(result.success){
                res.status(HTTP_statusCode.OK).json({success: result.success,message:'Contract signed', key: result.privateKey,signature: result.signature})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    changeStatus = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const {status} = req.body
            const result = await this.freelancerService.changeStatusService(id,status)
            if(result){
                res.status(HTTP_statusCode.OK).json({success: true, message: ' Project submitted '})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    removeProposal = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const result = await this.freelancerService.deleteProposalService(id)
            if (result?.success) {
                 res.status(200).json({ message: result.message, data: result.data });
              } else if (result?.message === "Proposal not found") {
                 res.status(404).json({ message: result?.message });
              } else {
                 res.status(500).json({ message: result?.message, error: result?.error });
              }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getNotification = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const result = await FreelancerRepository.getFreelancerNotification(id)
            if(result){
                res.status(HTTP_statusCode.OK).json({success: true, result})
            }else{
                res.status(HTTP_statusCode.NotFound).json({success: false, message: 'No Data found'})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    updateProfile = async(req: Request, res: Response)=>{
        try {
            console.log(req.body,'here in controller')
            const { id } = req.params;
            const data = req.body
            const photo= req.file
            console.log(id,data,photo, 'data from the frontend')

            if (photo) {
                console.log('Photo uploaded:', photo.originalname);
                data.photo = photo;
            } else {
                console.log('No new photo uploaded, existing photo will be retained');
                delete data.photo;
            }
            data.language = JSON.parse(data.language)
            data.skills = JSON.parse(data.skills)
            
            const result = await this.freelancerService.updateProfileService(id, data)
            if(result){
                res.status(HTTP_statusCode.OK).json({success: true, data: result, message: 'Profile updated successfully'})
            }
        } catch (error: any) {
            console.log(error,'this is the error')
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getWorkHistory = async(req: Request, res: Response)=>{
        try {
            console.log('here in get history controller')
            const {id} = req.params
            console.log(id,' we got the id too')
            const data = await this.freelancerService.getWorkHistoryService(id)
            if(!data){
                res.status(HTTP_statusCode.NotFound).json({success: false})
            }else{
                res.status(HTTP_statusCode.OK).json({success: true, data})
            }
        } catch (error: any) {
            console.log(error,'this is the error')
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getSkillList = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const data = await FreelancerRepository.getSkills(id)
            if(data){
                res.status(HTTP_statusCode.OK).json({success: true, data: data})
            }else{
                res.status(HTTP_statusCode.NotFound).json({success: false})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getFilteredData = async (req: Request, res: Response) => {
        try {
          const { userId, category, experience, duration, startDate, endDate, query }: any = req.query;
      
          const filter: any = { createdBy: { $ne: userId } };
      
          if (startDate && endDate) {
            filter.createdAt = {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            };
          }
      
          if (category) filter.category = category;
          if (experience) filter.projectType = experience;
          if (duration) filter.duration = duration;

          if(query){
            filter.title = {$regex: query, $options: 'i'}
          }
      
          const data = await FreelancerRepository.getFilteredJob(filter);
          console.log(data,'this is the data we got here for search and filter')
          res.status(HTTP_statusCode.OK).json({ success: true, data });
        } catch (error: any) {
          if (error instanceof AppError) {
            res.status(error.statusCode).json({
              success: false,
              message: error.message,
            });
          } else {
            res.status(HTTP_statusCode.InternalServerError).json({
              success: false,
              message: error.message || 'Internal Server Error',
            });
          }
        }
      };
      

    getDashboardData = async(req: Request, res:Response)=>{
        try {
            const {id} = req.params
            const data = await this.freelancerService.getDashboardDataService(id)
            console.log(data,'Freelancer Dashboard data')
            if(data){
                res.status(HTTP_statusCode.OK).json({success: true, data})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }

    getRatingReview = async(req: Request, res: Response)=>{
        try {
            console.log('hi its hereerererereererer')
            const {id} = req.params;
            console.log(id,'this is the freelancer id we got')
            const data = await FreelancerRepository.getReviews(id)
            if(data){
                res.status(HTTP_statusCode.OK).json({success: true, data})
            }else{
                res.status(HTTP_statusCode.NotFound).json({ success: false})
            }
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({
                    success: false, 
                    message: error.message
                });
            } else {
                res.status(HTTP_statusCode.InternalServerError).json({
                    success: false, 
                    message: error.message || 'Internal Server Error'
                });
            }
        }
    }
    
}
