import mongoose, { Schema, model, Document, ObjectId, Mongoose, mongo } from "mongoose";

export interface IJob extends Document{
    title: string,
    description: string
    skillsRequired: string[]
    budget?: number
    category: ObjectId
    duration: string
    projectType: string;
    status: 'open' | 'closed' | 'completed'
    isBlocked: Boolean
    createdBy: ObjectId
    created_At: Date
    proposals?:ObjectId[],
    invitesSent?:ObjectId[],
    hiredFreelancer?:{
        freelancerId: ObjectId
        hiredDate: Date
        contractId: ObjectId
    },
    isActive: boolean,
}

const jobSchema = new Schema<IJob>({
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
    duration:{
        type: String
    },
    projectType:{
        type: String
    },
    status:{
        type: String,
        enum: ['open','closed','completed'],
        default: 'open'
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
    proposals:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Proposals'
        }
    ],
    invitesSent:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
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
    },
    isActive:{
        type:Boolean,
        default: false
    },
},{
    timestamps: true
})

const jobModel =  model<IJob>('Job',jobSchema);

export default jobModel;
