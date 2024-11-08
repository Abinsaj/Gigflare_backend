import mongoose, { Schema, model, Document, ObjectId, Mongoose, mongo } from "mongoose";

export interface IJob extends Document{
    userId: string,
    title: string,
    description: string
    skillsRequired: string[]
    budget?: number
    category: ObjectId
    deadLine: Date
    status: 'open' | 'closed' | 'completed'
    language: string
    isBlocked: Boolean
    createdBy: ObjectId
    created_At: Date
    applicants?:[
        {
            freelancerId: ObjectId
            status: 'pending' | 'rejected' | 'hired'
        }
    ],
    hiredFreelancer?:{
        freelancerId: ObjectId
        hiredDate: Date
        contractId: ObjectId
    }
}

const jobSchema = new Schema<IJob>({
    userId:{
        type: String,
        required: true
    },
    title:{
        type:String,
        required: true
    },
    description:{
        type: String,
        required : true
    },
    skillsRequired:[{
        type: String
    }],
    budget:{
        type: Number
    },
    category:{
        type: String,
        required: true
    },
    deadLine:{
        type: Date
    },
    status:{
        type: String,
        enum: ['open','closed','completed'],
        default: 'open'
    },
    language:{
        type: String
    },
    isBlocked:{
        type: Boolean,
        default:false
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    created_At:{
        type: Date
    },
    applicants:[
        {
            freelancerId:{
                type: mongoose.Schema.Types.ObjectId,
                ref:'User'
            },
            status:{
                type: String,
                enum: ['pending', 'rejected', 'hired'],
                default: 'pending'
            }
        }
    ],
    hiredFreelancer:{
        freelancerId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        hiredDate:{
            type: Date
        },
        contractId:{
            type: mongoose.Schema.Types.ObjectId,
            ref : 'Contract'
        }
    }
},{
    timestamps: true
})

const jobModel =  model<IJob>('Job',jobSchema);

export default jobModel;
