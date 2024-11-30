import { Request, Response } from "express";
import HTTP_statusCode from "../Enums/httpStatusCode";
import { AdminService } from "../Services/adminServices";
import { AdminRepository } from "../Repository/adminRepository";

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
            console.log('dhe ivide')
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

    getFreelancerDetails = async(req: Request, res: Response)=>{
        try {
            const {freelancerId} = req.params
            const data = await this.adminService.getFreelancerService(freelancerId)
            console.log(data,'this is the data we need to send to frontend')
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
            console.log(updatedData,'this is the updated data we got')
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
            console.log('category get herer')
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
            const result = await AdminRepository.removeCategory(name)
            console.log(result,'result we got after deleting the category')
            res.status(HTTP_statusCode.OK).json({success: true,message: 'category deleted successfully'})
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json({success:false,message: 'Failed to delete the category'})
        }
    }

    getFreelancers = async(req:Request,res:Response)=>{
        try {
            const data = await this.adminService.getFreelancersService()
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error:any) {
            res.status(HTTP_statusCode.BadRequest).json(error.message)
        }
    }

    getJobList = async(req: Request, res: Response)=>{
        try {
            const data = await AdminRepository.getJobs()
            console.log(data,' this is the data we got')
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json('An unexpected error has occured')
        }
    }

    activateJob = async(req: Request, res: Response)=>{
        try {
            const {id} = req.body
            console.log(id,'we got the id')
            const data = await this.adminService.jobActivateService(id)
            console.log(data, ' this is the data')
            res.status(HTTP_statusCode.OK).json({success: true,data: data})
        } catch (error) {
            res.status(HTTP_statusCode.InternalServerError).json('An unexpected error has occured')
        }
    }

}




