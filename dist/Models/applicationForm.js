"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const fileMetadataSchema = new mongoose_1.Schema({
    filename: String,
    contentType: String,
    size: Number
});
const freelancerSchema = new mongoose_1.Schema({
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
const FreelancerApplication = (0, mongoose_1.model)('Freelancer', freelancerSchema);
exports.default = FreelancerApplication;
