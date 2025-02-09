import { NumValues } from "aws-sdk/clients/amplifyuibuilder";
import mongoose, { Schema, Document, ObjectId, model} from "mongoose";
import { IJobOffer } from "../Interfaces/common.interface";

  
  // export interface IMilestone {
  //   title: string;
  //   description: string;
  //   startDate: Date;
  //   endDate: Date;
  //   amount: number; 
  // }



  // const milestoneSchema = new Schema({
  //   title: { type: String, required: true },
  //   description: { type: String, required: true },
  //   startDate: { type: Date, required: true },
  //   endDate: { type: Date, required: true },
  //   amount: { type: Number, required: true },
  // }, { _id: false });


  const jobOfferSchema = new Schema<IJobOffer>({
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
      attachmentUrl:{
        type: String
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