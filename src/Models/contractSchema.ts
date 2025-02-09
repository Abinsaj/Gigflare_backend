import mongoose,{Schema, model, ObjectId, Document} from 'mongoose'
import { IContract } from '../Interfaces/common.interface';


const contractSchema = new Schema<IContract>({
    freelancerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Application', 
        required: true 
    },
    clientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    jobId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Job', 
        required: true 
    },
    offerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'JobOffer', 
        required: true 
    },
    totalBudget: { 
        type: Number, 
        required: true 
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partially_paid', 'paid'],
        default: 'unpaid',
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    initialPayment:{
        type: Number,
        required: true
    },
    remainingPayment:{
        type: Number,
        required: true
    },
    platformFee: { 
        type: Number, 
        required: true 
    },
    totalEarnings: { 
        type: Number, 
        required: true 
    },
    terms: {
        type: [String]
    },
    isTermsAccepted: { 
        type: Boolean, 
        default: false 
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'initial_payment', 'completed', 'submitted', 'termination_requested', 'termination_denied', 'terminated'],
        default: 'draft',
    },
    terminationReason: { 
        type: String 
    },
    terminationRequestedBy: { 
        type: String, 
        enum: ['client', 'freelancer'] 
    },
    contractHash:{
        type: String,
        required: true
    },
    refundAmount: { 
        type: Number, 
        default: 0 
    },
    signedByClient: { 
        signed: {
            type: Boolean,
            default: false,
        },
        signedAt: {
            type: Date,
        },
        signature: {
            type: String,
        },
        publicKey: {
            type: String,
        },
    },
    signedByFreelancer: { 
        signed: {
            type: Boolean,
            default: false,
        },
        signedAt: {
            type: Date,
        },
        signature: {
            type: String,
        },
        publicKey: {
            type: String,
        },
    },
  },
  { timestamps: true }
)

const ContractSchema = mongoose.model<IContract>('Contract', contractSchema);

export default ContractSchema;