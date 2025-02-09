import mongoose, { Document, Types,ObjectId } from "mongoose";

export interface IAddress{
  address: string
  country:  string
  state: string
  city: string
  pincode: string
}

export interface IUser extends Document{
    userId:string,
    name:string,
    email:string,
    phone?:string,
    password:string,
    createdAt?:Date,
    isFreelancer?:boolean,
    isBlocked?:boolean,
    freelancerCredentials?:{
        email?:String,
        uniqueID?:String,
    },
    profile?:string
    address?:IAddress[]
}

export interface ICleanedUser {
  _id: string | undefined;
  userId: string,
  name: string,
  email: string,
  isFreelancer?: boolean,
  isBlocked?:boolean,
  createdAt?:string 
}

export interface Photo {
  fileurl: string;
}

export interface Freelancer {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  photo: Photo;
  description: string;
  language: string;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    year: number;
  }>;
  certification: Array<{
    title: string;
    institution: string;
    year: number;
  }>;
  certficatImage: string[];
  portfolio: string;
  email: string;
  phone: string;
  status: string;
  experience: Array<{
    role: string;
    company: string;
    years: number;
  }>;
  userId: ObjectId;
  applicationId: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}


// /////////////////////////////////////////////

interface IEducation {
    collageName: string;
    title: string;
    year: number;
}

interface ICertification {
    name: string;
    year: number;
}

interface IExperience {
    categoryId: mongoose.Schema.Types.ObjectId,
    expertise: string;
    fromYear: number;
    toYear: number;
}

interface IFileMetadata {
    fileurl: string;
}

export interface IFreelancer extends Document {
    _id: ObjectId;
    userId: ObjectId;
    applicationId: string;
    firstName: string;
    lastName: string;
    photo?: IFileMetadata;
    description: string;
    language: string[];
    experience: IExperience;
    skills: ObjectId[];
    education?: IEducation[];
    certification?: ICertification[];
    certficatImage?: string[]
    portfolio?: string;
    email: string;
    phone?: string;
    status: 'pending' | 'accepted' | 'rejected';
}


export default interface IJob extends Document{
  title: string,
  description: string
  skillsRequired: ObjectId[]
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
  isActive?: boolean,
}

export interface ICategory extends Document{
  name: string,
  description: string,
  isBlocked: boolean
}

// export interface Proposal {
//   _id: ObjectId;
//   jobId: ObjectId;
//   freelancerId: ObjectId | Freelancer;
//   coverLetter: string;
//   timeLine: string;
//   status: string;
//   totalBudget: number;
//   createdAt: Date;
//   updatedAt: Date;
//   __v: number;
// }

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

export interface INotification extends Document{
  userId: ObjectId,
  type: 'message' | 'proposal' | 'offer' | 'contract',
  message: string
  data: Object,
  isRead: boolean
}

/////////////////// Contract Schema ///////////////////////

export interface ISigningDetails{
  signed:Boolean,
  signedAt: Date
  signature: String,
  publicKey: String,

}

export interface IContract extends Document{
  freelancerId: ObjectId;
  clientId: ObjectId;
  jobId: ObjectId;
  offerId: ObjectId;
  totalBudget: number;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  startDate: Date;
  endDate: Date;
  initialPayment:number;
  remainingPayment: number;
  platformFee: number;
  totalEarnings: number;
  terms: [];
  isTermsAccepted: boolean;
  status: 'draft'| 'initial_payment' | 'active' | 'completed' | 'submitted' | 'termination_requested' | 'terminated';
  terminationReason?: string;
  terminationRequestedBy?: 'client' | 'freelancer';
  refundAmount?: number;
  signedByClient: ISigningDetails;
  signedByFreelancer: ISigningDetails;
  contractHash: string;
}

/////////////////////////////////////////////////

export interface IReview extends Document{
  clientId: mongoose.Types.ObjectId;
  freelancerId: mongoose.Types.ObjectId;
  rating?: number;
  review?: string;
}

export interface ISkill extends Document {
  name: string;
  category: ObjectId;
  description: string;
  isBlocked: boolean;
} 


export interface IJobOffer extends Document {
  clientId:any;
  freelancerId: any; 
  jobId: any; 
  proposalId: any;
  budget: number;
  fromDate: Date;
  toDate: Date;
  upfrontAmount: number;
  restAmount: number;
  platformFee: number;
  termsAccepted?: boolean;
  attachmentUrl?: string;
  status?: 'pending' | 'accepted' | 'rejected';
}