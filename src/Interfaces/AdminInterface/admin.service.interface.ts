import IJob, { ICategory, IContract, IFreelancer, ISkill, IUser } from "../common.interface"

export default interface IAdminService {
    verifyAdmin(email: string, password: string):Promise<{accessToken: string, adminInfo: any, refreshToken: string}>
    getUsersListService(page: any, limit: any):Promise<{user:IUser[],totalPages:number}>
    getFreelancersService(page: any, limit: any):Promise<{freelancer:IFreelancer[], totalPages:number} | undefined>
    getFreelancerApplicaitonService(page: any, limit: any):Promise<{freelancer: IFreelancer[], totalPages: number}>
    updateFreelancerService(applicationId: string, status: string):Promise<boolean | IFreelancer>
    blockFreelancerService( email: string, isBlocked: boolean): Promise<boolean>
    blockUserService(email: string, isBlocked: boolean): Promise<boolean>
    createCategoryService(name: string, description: string): Promise<boolean>
    getCategoryService():Promise<ICategory[]>
    removeCategoryService(name: string): Promise<boolean | undefined>
    blockUnblockCategoryService(name: string, status: string): Promise<boolean>
    getFreelancerService(id: string): Promise<any>
    getJobsService(): Promise<IJob[]>
    jobActivateService(id: string): Promise<IJob | null | undefined>
    getContractService():Promise<IContract[]>
    createSkillService(data: any): Promise<boolean>
    getSkillsService(page: any, limit: any): Promise<{data: ISkill[], totalPages: number}>
    blockUnblockSkillService(id: string, status: 'block' | 'unblock'): Promise<ISkill>
    getTransactionService(): Promise<any>
    getDashboardDataService(): Promise<{totalJobs: any, activeContracts: number, completedContracts: number, totalProfit: number, recentContracts: IContract[]}>
    getGraphDataService(timeframe: string):Promise<any>

}