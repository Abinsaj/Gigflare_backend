import mongoose, {Schema, model, Document} from "mongoose";
import { IReview } from "../Interfaces/common.interface";


const reviewSchema = new Schema<IReview>({
    clientId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    freelancerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    rating:{
        type: Number,
        min: 1,
        max: 5
    },
    review:{
        type: String,
    }
},{
    timestamps: true
})

const ReviewSchema = mongoose.model<IReview>('Review',reviewSchema)

export default ReviewSchema