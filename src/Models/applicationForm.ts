import mongoose, { model, Document, Schema } from "mongoose";

interface IEducation {
    collageName: string;
    title: string;
    year: number;
}

interface ICertification {
    name: string;
    year: number;
    file?: {
        filename: string;
        contentType: string;
        size: number;
    };
}

interface IExperience {
    expertise: string;
    fromYear: number;
    toYear: number;
}

interface IFileMetadata {
    filename: string;
    contentType: string;
    size: number;
}

export interface IFreelancer extends Document {
    applicationId: string;
    firstName: string;
    lastName: string;
    photo?: IFileMetadata;
    description: string;
    language: string;
    experience: IExperience[];
    skills: string[];
    education?: IEducation[];
    certification?: ICertification[];
    portfolio?: string;
    email: string;
    phone?: string;
    status: 'pending' | 'accepted' | 'rejected';
}

const fileMetadataSchema = new Schema<IFileMetadata>({
    filename: String,
    contentType: String,
    size: Number
});

const freelancerSchema = new Schema<IFreelancer>({
    applicationId: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true
    },
    photo: fileMetadataSchema,
    description: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true
    },
    experience: [{
        expertise: {
            type: String,
            required: true,
        },
        fromYear: {
            type: Number,
            required: true
        },
        toYear: {
            type: Number,
            required: true
        }
    }],
    skills: [{
        type: String
    }],
    education: [{
        collageName: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        year: {
            type: Number
        }
    }],
    certification: [{
        name: {
            type: String,
            required: true
        },
        year: {
            type: Number
        },
        file: fileMetadataSchema
    }],
    portfolio: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const FreelancerApplication = model<IFreelancer>('Freelancer', freelancerSchema);

export default FreelancerApplication;