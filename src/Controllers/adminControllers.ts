import { Request, Response } from "express";
import HTTP_statusCode from "../Enums/httpStatusCode";
import { AdminService } from "../Services/adminServices";

export class AdminController{
    private adminService: AdminService;
    constructor(adminService: AdminService){
        this.adminService = adminService
    }

    verifyAdmin = async(req: Request, res: Response)=>{
        try {
            console.log('its here')
            const {email, password} = req.body
            console.log(email,password)
            const data = await this.adminService.verifyAdmin(email, password)
            res.status(HTTP_statusCode.OK).json({message: 'Admin login succesful',data})

        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({message: error.message})
        }
    }

    getUsers = async(req: Request, res: Response) =>{
        try {
            const users = await this.adminService.getUsersListService()
            res.status(HTTP_statusCode.OK).json(users)
        } catch (error: any) {
            res.status(HTTP_statusCode.BadRequest).json(error.message)
        }
    }

    getFreelancerApplication = async(req: Request, res: Response) => {
        try {
            const data = await this.adminService.getFreelancerApplicaitonService()
            if(!data){
                res.status(HTTP_statusCode.BadRequest).json('No data in the database')
            }else{
                res.status(HTTP_statusCode.OK).json({message:'data fetched successfully',data})
            }
        } catch (error) {
            res.status(HTTP_statusCode.BadRequest).json(error)
        }
    }

    updateFreelancerStatus = async(req: Request, res: Response)=>{
        try {
            console.log('its here')
            console.log(req.params)
            console.log(req.body)
            const {applicationId }= req.params
            const {status} = req.body
           

            await this.adminService.updateFreelancerService(applicationId,status)
            res.status(HTTP_statusCode.OK).json({message: 'Freelancer status updated successfully' })
        } catch (error) {
            res.status(HTTP_statusCode.BadRequest).json(error)
        }
    }

    blockFreelancer = async(req: Request, res: Response)=>{
        try {
            const {email} = req.params;
            const {isBlocked} = req.body

            await this.adminService.blockFreelancerService(email,isBlocked)
            res.status(HTTP_statusCode.OK).json('user blocked')
        } catch (error: any) {
            res.status(HTTP_statusCode.BadRequest).json(error.message)
        }
    }

    blockUser = async(req: Request, res: Response)=>{
        try {
            console.log(req.body)
            const {email} = req.params;
            const {isBlocked} = req.body

            await this.adminService.blockUserService(email,isBlocked)
            res.status(HTTP_statusCode.OK).json('user blocked')
        } catch (error: any) {
            res.status(HTTP_statusCode.BadRequest).json(error.message)
        }
    }
}


