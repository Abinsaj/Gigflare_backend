import mongoose from "mongoose";

export interface IUser{
    userId:string,
    name:string,
    email:string,
    phone?:string,
    password:string,
    created_At?:Date,
    isFreelancer?:boolean,
    isBlocked?:boolean,
    freelancerCredentials?:{
        email?:String,
        uniqueID?:String,
    },
    profile?:string
}

// src/types/Models.ts
import { ObjectId } from 'mongoose';

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

export interface Proposal {
  _id: ObjectId;
  jobId: ObjectId;
  freelancerId: ObjectId | Freelancer;
  coverLetter: string;
  timeLine: string;
  status: string;
  totalBudget: number;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
