"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    created_At: {
        type: Date,
        required: true
    },
    isFreelancer: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    freelancerCredentials: {
        email: {
            type: String,
        },
        uniqueID: {
            type: String
        }
    },
    profile: {
        type: String,
    }
});
userSchema.index({ 'freelancerCredentials.freelancerId': 1 }, { unique: true, partialFilterExpression: { 'freelancerCredentials.freelancerId': { $exists: true, $ne: null } } });
const userModel = (0, mongoose_1.model)('User', userSchema);
exports.default = userModel;
