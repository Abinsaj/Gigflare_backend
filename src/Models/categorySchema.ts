import mongoose,{ model, Document, Schema } from "mongoose";

export interface ICategory extends Document{
    name: string,
    description: string
}

const categorySchema = new Schema<ICategory>({
    name:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
},{
    timestamps: true
});

const CategorySchema = model<ICategory> ('Category',categorySchema);

export default CategorySchema;



