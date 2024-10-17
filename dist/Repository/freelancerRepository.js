"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreelancerRepository = void 0;
const applicationForm_1 = __importDefault(require("../Models/applicationForm"));
const userSchema_1 = __importDefault(require("../Models/userSchema"));
class FreelancerRepository {
    static saveApplication(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userSchema_1.default.findOne({ email: data.email });
                if (!user) {
                    throw new Error('User not found');
                }
                const isApplicatinExist = yield applicationForm_1.default.findOne({ email: data.email });
                if (isApplicatinExist) {
                    throw new Error('You have already applied for freelancer');
                }
                const application = new applicationForm_1.default(data);
                const savedApplication = yield application.save();
                console.log('Freelancer Application saved successfully:', savedApplication._id);
                return savedApplication;
            }
            catch (error) {
                console.error('Error saving freelancer application:', error);
                throw new Error(error.message || 'Error saving freelancer application');
            }
        });
    }
    static getFreelancerApplications() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('its herer in freelancer repository');
                const freelancer = yield applicationForm_1.default.find().sort({ createdAt: -1 });
                if (!freelancer) {
                    throw new Error('No freelancers have found');
                }
                console.log(freelancer);
                return freelancer;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static updateStatus(applicationId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('finally it reached here');
                console.log(status, 'this is the status');
                const updatedApplication = yield applicationForm_1.default.findOneAndUpdate({ applicationId }, { $set: { status: status } }, { new: true });
                if (!updatedApplication) {
                    console.log('Application not found');
                    return false;
                }
                console.log(updatedApplication, 'this is the updated data');
                if (status === 'accepted') {
                    console.log('Status is accepted, updating user');
                    const user = yield userSchema_1.default.findOne({ email: updatedApplication.email });
                    if (user) {
                        user.isFreelancer = true;
                        user.freelancerCredentials = {
                            email: updatedApplication.email,
                            uniqueID: updatedApplication.applicationId
                        };
                        yield user.save();
                        console.log('User updated:', user);
                    }
                }
                return true;
            }
            catch (error) {
                console.error('Error in updateStatus:', error);
                throw new Error(error);
            }
        });
    }
}
exports.FreelancerRepository = FreelancerRepository;
