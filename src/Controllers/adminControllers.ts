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
            const {email, password} = req.body
            const data = await this.adminService.verifyAdmin(email, password)
            res.cookie('AdminAccessToken',data.accessToken,{
                httpOnly: true,
                sameSite:'none',
                secure: true,
                maxAge: 60 * 1000,
            })

            res.cookie('AdminRefreshToken',data.refreshToken,{
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                maxAge: 7 * 24 * 60 * 60 * 10000
            })

            const {adminInfo} = data
            const cred = adminInfo.email
            res.status(HTTP_statusCode.OK).json({message: 'Admin login succesful',cred})

        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({message: error.message})
        }
    }

    getUsers = async(req: Request, res: Response) =>{
        try {
            const users = await this.adminService.getUsersListService()
            res.clearCookie('AccessToken')
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
            res.status(HTTP_statusCode.OK).json({success:true,message:'user blocked'})
        } catch (error: any) {
            res.status(HTTP_statusCode.BadRequest).json({success:false,message:error.message})
        }
    }
    
    adminLogout = async(req: Request, res: Response)=>{
        try {
            res.clearCookie('AdminAccessToken')
            res.status(HTTP_statusCode.OK).json({success: true,message: 'Admin logout'})
        } catch (error: any) {
            console.log(error.message)
            res.status(HTTP_statusCode.InternalServerError).json({success: false,message:'Failed to delete Admin'})
        }
    }

    createCategory = async(req: Request, res: Response)=>{
        try {

            const {data} = req.body
            await this.adminService.createCategoryService(data.name, data.description)
            res.status(HTTP_statusCode.OK).json({success: true, message:'Category successfuly added'})
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({success:false, message:error.message})
        }
    }

    getCategories = async(req: Request,res: Response)=>{
        try {
            const data = await this.adminService.getCategoryService()
            if(data){
                res.status(HTTP_statusCode.OK).json({success: true, message:'Data fetched successfully',data})
            }else{
                res.status(HTTP_statusCode.TaskFailed).json({success: false, message:'Failed to fetch data'})
            }
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({success: false, message:error.message})
        }
    }

    blockunblockCategory = async(req: Request, res: Response)=>{
        try {
            console.log("the data reached the controller")
            const {categoryName} = req.params
            const {status} = req.body
            console.log(status)
            await this.adminService.blockUnblockCategoryService(categoryName,status)
            res.status(HTTP_statusCode.OK).json({success: true, message:'category blocked'})
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({success: false, message:error.message})
        }
    }
}


