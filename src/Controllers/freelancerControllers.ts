import { Request, Response } from "express";
import HTTP_statusCode from "../Enums/httpStatusCode";
import { FreelancerService } from "../Services/freelancerServices";
import { FreelancerRepository } from "../Repository/freelancerRepository";
import { HttpStatusCode } from "axios";
import AppError from "../utils/AppError";


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
    
}
