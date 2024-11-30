import mongoose, { Schema, Document, ObjectId, model, mongo } from "mongoose";




export interface IProposal extends Document{
    jobId: ObjectId,
    userId: ObjectId,
    freelancerId: ObjectId,
    coverLetter: String;
    timeLine: String;
    status: 'submitted' | 'approved' | 'rejected';
    totalBudget: number;
    createdAt: Date;
    updatedAt: Date;
}

const proposalSchema = new Schema<IProposal>({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    freelancerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    },
    coverLetter:{
        type: String,
        required: true
    },
    timeLine: {
        type: String
    },
    status:{
        type: String,
        enum: ['submitted' , 'approved' , 'rejected'],
        default: 'submitted'
    },
    totalBudget:{
        type: Number,
        required: true
    }
},{
    timestamps: true
})

const ProposalModel = mongoose.model<IProposal>('Proposals',proposalSchema)

export default ProposalModel;