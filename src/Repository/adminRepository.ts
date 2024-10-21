import CategorySchema from "../Models/categorySchema";

export class AdminRepository{
    static async createCatregory(name:string, description:string){
        try {

            const category = await CategorySchema.findOne({
                name: { $regex: new RegExp(`${name}$`,'i')}
            })

            if(category){
                throw new Error('Category Already exist')
            }
            const newCategory =  CategorySchema.create({
                name:name,
                description:description
            })
            return newCategory
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    static async getCategories(){
        try {
            const data = await CategorySchema.find()
            console.log(data,'this is the data')
            if(!data){
                throw new Error('No category data found')
            }
            return data
        } catch (error: any) {
            throw  new Error(error.message)
        }
    }

    static async blockUnblockCategory(name: string, status: boolean | undefined){
        try {
            console.log('the data has reached here',status)
            const data = await CategorySchema.findOneAndUpdate(
                {name},
                {
                    $set:{isBlocked: status}
                },
                {new: true}
            );
            if(!data){
                throw new Error('category not found')
            }
            return true
        } catch (error: any) {
            throw new Error(error.message)
        }
    }
}