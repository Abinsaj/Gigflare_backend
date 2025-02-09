import mongoose,{Schema, model, Document} from "mongoose";
import { IUser } from "../Interfaces/common.interface";



const userSchema = new Schema<IUser>({
    userId:{
        type:String,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:String,
    },
    password:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
    },
    isFreelancer:{
        type:Boolean,
        default:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    freelancerCredentials:{
        email:{
            type:String,
        },
        uniqueID:{
            type:String
        }
    },
    profile:{
        type:String,
    },
    address:[{
        address:{
            type: String
        },
        country:{
            type: String
        },
        state:{
            type: String
        },
        city:{
            type: String
        },
        pincode:{
            type: String
        },
    }]
},
{
    timestamps:true
});

userSchema.index(
    { 'freelancerCredentials.freelancerId': 1},
    { unique:true, partialFilterExpression: { 'freelancerCredentials.freelancerId': { $exists : true, $ne : null}}}
);

const userModel = model<IUser>('User',userSchema);

export default userModel;