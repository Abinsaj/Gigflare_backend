import { NumValues } from "aws-sdk/clients/amplifyuibuilder";
import mongoose, { Schema, Document, ObjectId, model} from "mongoose";

  
  // export interface IMilestone {
  //   title: string;
  //   description: string;
  //   startDate: Date;
  //   endDate: Date;
  //   amount: number; 
  // }

  export interface IJobOffer extends Document {
    clientId:ObjectId;
    freelancerId: ObjectId; 
    jobId: ObjectId; 
    budget: number;
    fromDate: Date;
    toDate: Date;
    upfrontAmount: number;
    restAmount: number;
    platformFee: number;
    termsAccepted?: boolean;
    status?: 'pending' | 'accepted' | 'rejected';
  }

  // const milestoneSchema = new Schema({
  //   title: { type: String, required: true },
  //   description: { type: String, required: true },
  //   startDate: { type: Date, required: true },
  //   endDate: { type: Date, required: true },
  //   amount: { type: Number, required: true },
  // }, { _id: false });


  const jobOfferSchema = new Schema({
    clientId:{
      type:Schema.Types.ObjectId,
      ref: 'User'
    },
    freelancerId: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
      },
      proposalId:{
        type: Schema.Types.ObjectId,
        ref: 'Proposals'
      },
      jobId: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: true
      },
      budget: {
        type: Number,
        required: true,
      },
      fromDate: {
        type: Date,
        required: true
      },
      toDate: {
        type: Date,
        required: true
      },
      upfrontAmount:{
        type: Number,
        required: true
      },
      restAmount:{
        type: Number,
        required: true
      },
      platformFee: {
        type: Number,
        required: true
      },
      termsAccepted: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      }
  },{
    timestamps: true
  })

  const jobOfferModel = model<IJobOffer>('JobOffer', jobOfferSchema)

  export default jobOfferModel