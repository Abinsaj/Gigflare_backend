import IJob, { ICategory, IContract, IFreelancer, ISkill, IUser } from "../common.interface";

export default interface IAdminRepository{
    getUsers(page:any,limit:any):Promise<{user:IUser[],totalPages:number}>
    getFreelancers(page:any, limit: any):Promise<{freelancer:IFreelancer[], totalPages:number} | undefined>
    getFreelancerApplications(page: any, limit: any): Promise<{freelancer: IFreelancer[], totalPages: number}>
    updateStatus(applicationId: string, status: string):Promise<boolean | IFreelancer>
    blockFreelancer(email: string, isBlocked: boolean):Promise<boolean>
    blockUser(email: string, isBlocked: boolean): Promise<boolean>
    createCatregory(name: string, description: string):Promise<ICategory>
    getCategories():Promise<ICategory[]>
    removeCategory(name: string): Promise<boolean | undefined>
    blockUnblockCategory(name: string, status: boolean | undefined): Promise<boolean>
    getJobs(): Promise<IJob[] | undefined>
    activateJob(id: string): Promise<IJob | null | undefined>
    getContractRepo():Promise<IContract[]>
    createSkills(data: any):Promise<ISkill>
    getSkills(page: any, limit: any):Promise<{data: ISkill[], totalPages: number}>
    blockUnblockSkills(id: string, status: boolean | undefined): Promise<ISkill>
    getGraphDataFromDB(startDate: Date, endDate: Date, timeframe: "MONTHLY" | "WEEKLY" | "YEARLY"): Promise<any>
}