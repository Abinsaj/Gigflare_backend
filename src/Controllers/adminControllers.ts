import { Request, Response } from "express";
import HTTP_statusCode from "../Enums/httpStatusCode";
import { AdminService } from "../Services/adminServices";
import { AdminRepository } from "../Repository/adminRepository";
import AppError from "../utils/AppError";
import IAdminService from "../Interfaces/AdminInterface/admin.service.interface";

export class AdminController{
    private adminService: IAdminService;
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
            console.log('dhe ivide')
            const {page,limit} = req.query
            const users = await this.adminService.getUsersListService(page,limit)
            res.status(HTTP_statusCode.OK).json(users)
        } catch (error: any) {
            res.status(HTTP_statusCode.BadRequest).json(error.message)
        }
    }

    getFreelancerApplication = async(req: Request, res: Response) => {
        try {
            const { page, limit } = req.query
            const data = await this.adminService.getFreelancerApplicaitonService(page,limit)
            if(!data){
                res.status(HTTP_statusCode.BadRequest).json('No data in the database')
            }else{
                res.status(HTTP_statusCode.OK).json({message:'data fetched successfully',data})
            }
        } catch (error) {
            res.status(HTTP_statusCode.BadRequest).json(error)
        }
    }

    getFreelancerDetails = async(req: Request, res: Response)=>{
        try {
            const {freelancerId} = req.params
            const data = await this.adminService.getFreelancerService(freelancerId)
            res.status(HTTP_statusCode.OK).json({freelancerData: data.freelancerData,profileImg:data.image,certImage:data.certificateImg})
        } catch (error:any) {
            res.status(HTTP_statusCode.InternalServerError).json(error.message || 'An unexpected error has occured')
        }
    }

    updateFreelancerStatus = async(req: Request, res: Response)=>{
        try {
            const {applicationId }= req.params
            const {status} = req.body
            const updatedData = await this.adminService.updateFreelancerService(applicationId, status);
            if (status === 'accepted') {
                
                res.status(HTTP_statusCode.OK).json({
                    success:true,
                    message: 'Freelancer accepted and user updated successfully',
                    freelancerInfo: updatedData
                });
            } else {
                
                res.status(HTTP_statusCode.OK).json({
                    success:true,
                    message: 'Freelancer status updated',
                });
            }
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
            const {categoryName} = req.params
            const {status} = req.body
            await this.adminService.blockUnblockCategoryService(categoryName,status)
            res.status(HTTP_statusCode.OK).json({success: true, message:'category blocked'})
        } catch (error: any) {
            res.status(HTTP_statusCode.InternalServerError).json({success: false, message:error.message})
        }
    }

    deleteCategory = async(req: Request,res: Response)=>{
        try {
            const {name} = req.params
            const result = await this.adminService.removeCategoryService(name)
            res.status(HTTP_statusCode.OK).json({success: true,message: 'category deleted successfully'})
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json({success:false,message: 'Failed to delete the category'})
        }
    }

    getFreelancers = async(req:Request,res:Response)=>{
        try {
            const {page,limit} = req.query
            const data = await this.adminService.getFreelancersService(page,limit)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error:any) {
            res.status(HTTP_statusCode.BadRequest).json(error.message)
        }
    }

    getJobList = async(req: Request, res: Response)=>{
        try {
            const data = await this.adminService.getJobsService()
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json('An unexpected error has occured')
        }
    }

    activateJob = async(req: Request, res: Response)=>{
        try {
            const {id} = req.body
            const data = await this.adminService.jobActivateService(id)
            res.status(HTTP_statusCode.OK).json({success: true,data: data})
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json('An unexpected error has occured')
        }
    }

    getContracts = async(req: Request, res: Response)=>{
        try {
            const data = await this.adminService.getContractService()
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

    createSkills = async(req: Request, res: Response)=>{
        try {
            const {data} = req.body
            const result = await this.adminService.createSkillService(data) 
            if(result ==  true){
                res.status(HTTP_statusCode.OK).json({success: true, message: 'skill created successfully'})
            }else{
                res.status(HTTP_statusCode.TaskFailed).json({ success: false, message: 'Failed to create skill'})
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

    getSkills = async(req: Request, res: Response)=>{
        try {
            const { page, limit } = req.query
            const skillData = await this.adminService.getSkillsService(page,limit)
            res.status(HTTP_statusCode.OK).json({ success: true, skillData})
            
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

    blockUnblockSkill = async(req: Request, res: Response)=>{
        try {
            const {id, status} = req.body
            const data = await this.adminService.blockUnblockSkillService(id,status)
            if(data.isBlocked == true){
                res.status(HTTP_statusCode.OK).json({success: true, message:'skill blocked'})
            }else{
                res.status(HTTP_statusCode.OK).json({success: true, message:'skill unblocked'})

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

    getAllTransactions = async(req: Request, res: Response)=>{
        try {
            const data = await this.adminService.getTransactionService()
            if(data.length > 0){
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

    getDashboardData = async(req: Request, res: Response)=>{
        try {
            const data = await this.adminService.getDashboardDataService()
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

    getGraphData = async(req: Request, res: Response)=>{
        try {
            const {timeframe} = req.params
            const data = await this.adminService.getGraphDataService(timeframe)
            res.status(HTTP_statusCode.OK).json({success: true, data})
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




