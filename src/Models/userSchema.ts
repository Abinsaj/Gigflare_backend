import mongoose,{Schema, model, Document} from "mongoose";

export interface IUser extends Document{
    userId:string,
    name:string,
    email:string,
    phone:string,
    password:string,
    created_At:Date,
    isFreelancer?:boolean,
    isBlocked:boolean,
    freelancerCredentials?:{
        email?:String,
        uniqueID?:String,
    },
    profile?:string
}

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
        required:true
    },
    password:{
        type:String,
        required:true
    },
    created_At:{
        type:Date,
        required:true
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
    }
});

userSchema.index(
    { 'freelancerCredentials.freelancerId': 1},
    { unique:true, partialFilterExpression: { 'freelancerCredentials.freelancerId': { $exists : true, $ne : null}}}
);

const userModel = model<IUser>('User',userSchema);

export default userModel;