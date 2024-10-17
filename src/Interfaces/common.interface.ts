import mongoose from "mongoose";

export interface IUser{
    userId:string,
    name:string,
    email:string,
    phone:string,
    password:string,
    created_At:Date,
    isFreelancer?:boolean,
    isBlocked?:boolean,
    freelancerCredentials?:{
        email?:String,
        uniqueID?:String,
    },
    profile?:string
}