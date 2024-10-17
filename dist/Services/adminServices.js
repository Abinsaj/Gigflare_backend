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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const jwtConfig_1 = require("../Config/jwtConfig");
const freelancerRepository_1 = require("../Repository/freelancerRepository");
const userRepository_1 = require("../Repository/userRepository");
require('dotenv').config();
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
class AdminService {
    constructor() {
        this.verifyAdmin = (email, password) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (email !== adminEmail) {
                    throw new Error('Invalid Email');
                }
                else if (password !== adminPassword) {
                    throw new Error('Wrong Password');
                }
                const adminInfo = {
                    email
                };
                const accessToken = (0, jwtConfig_1.createToken)(email, 'Admin');
                console.log(accessToken);
                return adminInfo;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
        this.getUsersListService = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield userRepository_1.UserRepository.getUsers();
                console.log(users, ' this is the users list ');
                const cleanedUsers = users.map((user) => {
                    const { userID, name, email, phone, isBlocked, isFreelancer, created_At } = user._doc;
                    return {
                        userID,
                        name,
                        email,
                        phone,
                        isBlocked,
                        isFreelancer,
                        created_At: created_At.toISOString().slice(0, 10)
                    };
                });
                return { users: cleanedUsers };
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
        this.getFreelancerApplicaitonService = () => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('ithththth ehehhrereer');
                const freelancer = yield freelancerRepository_1.FreelancerRepository.getFreelancerApplications();
                if (!freelancer) {
                    throw new Error('No data have been found');
                }
                else {
                    return freelancer;
                }
            }
            catch (error) {
                throw error;
            }
        });
        this.updateFreelancerService = (applicationId, status) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('its already');
                console.log(status, 'ivida indaya mathi');
                const updateData = yield freelancerRepository_1.FreelancerRepository.updateStatus(applicationId, status);
                if (!updateData) {
                    return false;
                }
                else {
                    return true;
                }
            }
            catch (error) {
                throw error;
            }
        });
        this.blockFreelancerService = (email, isBlocked) => __awaiter(this, void 0, void 0, function* () {
            try {
                const blockData = yield userRepository_1.UserRepository.blockFreelancer(email, isBlocked);
                if (blockData) {
                    return true;
                }
                else {
                    throw new Error('failed to block user');
                }
            }
            catch (error) {
                throw new Error;
            }
        });
        this.blockUserService = (email, isBlocked) => __awaiter(this, void 0, void 0, function* () {
            try {
                const blockData = yield userRepository_1.UserRepository.blockUser(email, isBlocked);
                if (blockData) {
                    return true;
                }
                else {
                    throw new Error('failed to block user');
                }
            }
            catch (error) {
                throw new Error;
            }
        });
    }
}
exports.AdminService = AdminService;
