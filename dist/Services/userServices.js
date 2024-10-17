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
exports.UserService = void 0;
const userRepository_1 = require("../Repository/userRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const emailConfig_1 = __importDefault(require("../Config/emailConfig"));
const jwtConfig_1 = require("../Config/jwtConfig");
class UserService {
    constructor() {
        this.userData = null;
        this.OTP = null;
        this.expiryOTP_time = null;
        this.email = null;
        this.register = (userData) => __awaiter(this, void 0, void 0, function* () {
            try {
                const existUser = yield userRepository_1.UserRepository.existUser(userData.email);
                if (existUser) {
                    throw new Error('Email already in use');
                }
                const saltRounds = 10;
                const hashPassword = yield bcrypt_1.default.hash(userData.password, saltRounds);
                const userId = (0, uuid_1.v4)();
                const tempData = {
                    userId: userId,
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    password: hashPassword,
                    created_At: new Date(),
                };
                this.userData = tempData;
                const generateOtp = Math.floor(100000 + Math.random() * 900000).toString();
                console.log(generateOtp);
                this.OTP = generateOtp;
                const isMailSend = yield (0, emailConfig_1.default)(userData.email, generateOtp);
                if (!isMailSend) {
                    throw new Error('Failed to send OTP to email');
                }
                const otp_time = new Date();
                this.expiryOTP_time = new Date(otp_time.getTime() + 2 * 60 * 1000);
                return;
            }
            catch (error) {
                throw error;
            }
        });
        this.verifyOtp = (email, otp) => __awaiter(this, void 0, void 0, function* () {
            try {
                const actualOtp = this.OTP;
                const userData = this.userData;
                const currentTime = new Date();
                const expiryTime = this.expiryOTP_time;
                if (currentTime > expiryTime) {
                    throw new Error('OTP has expired');
                }
                else {
                    if (actualOtp !== otp) {
                        throw new Error('Wrong OTP');
                    }
                    yield userRepository_1.UserRepository.createUser(userData);
                    this.OTP = null;
                    this.expiryOTP_time = null;
                    this.userData = null;
                }
                return true;
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
        this.login = (email, password) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(password, 'this is the user password');
                const userExist = yield userRepository_1.UserRepository.verifyLogin(email, password);
                console.log('the user data we got is ', userExist);
                if (!userExist) {
                    throw { message: 'Invalid login credentials' };
                }
                if (userExist.isBlocked == true) {
                    throw { message: 'User is blocked' };
                }
                const compare = yield bcrypt_1.default.compare(password, userExist.password);
                if (!compare) {
                    throw { message: 'Incorrect password' };
                }
                const userInfo = {
                    userId: userExist.userId,
                    name: userExist.name,
                    email: userExist.email,
                    phone: userExist.phone,
                    isBlocked: userExist.isBlocked
                };
                const accessToken = (0, jwtConfig_1.createToken)(userExist.userId, "user");
                const refreshToken = (0, jwtConfig_1.createRefreshToken)(userExist.userId, "user");
                return { accessToken, refreshToken, userInfo };
            }
            catch (error) {
                throw { message: error.message || 'Internal server error' };
            }
        });
        this.resendOtp = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                this.OTP = generatedOtp;
                const sendEmail = yield (0, emailConfig_1.default)(this.userData.email, generatedOtp);
                if (!sendEmail) {
                    throw new Error('Email not send');
                }
                const create_time = new Date();
                this.expiryOTP_time = new Date(create_time.getTime() + 2 * 60 * 1000);
            }
            catch (error) {
                throw error;
            }
        });
        this.verifyEmailAndSendOTP = (email) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('its herererererer');
                const emailExist = yield userRepository_1.UserRepository.verifyEmail(email);
                if (!emailExist) {
                    throw new Error('Email is not valid');
                }
                else {
                    const generateOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    console.log(generateOtp);
                    this.OTP = generateOtp;
                    const isMailSend = yield (0, emailConfig_1.default)(email, generateOtp);
                    if (!isMailSend) {
                        return { email: '', bool: false };
                    }
                    const otp_time = new Date();
                    this.email = email;
                    this.expiryOTP_time = new Date(otp_time.getTime() + 2 * 60 * 1000);
                    return { email: email, bool: true };
                }
            }
            catch (error) {
                throw { message: error.message || 'Internal server error' };
            }
        });
        this.verifyForgotOtp = (otp) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Verifying OTP:', otp);
                if (!this.OTP || !this.expiryOTP_time) {
                    throw new Error('OTP not initialized');
                }
                const actualOtp = this.OTP;
                console.log('Actual OTP:', actualOtp);
                const currentTime = new Date();
                console.log('Current time:', currentTime);
                const expiryTime = new Date(this.expiryOTP_time);
                console.log('Expiry time:', expiryTime);
                if (currentTime > expiryTime) {
                    throw new Error('OTP has expired');
                }
                if (actualOtp !== otp) {
                    throw new Error('Wrong OTP');
                }
                this.OTP = null;
                this.expiryOTP_time = null;
                return true;
            }
            catch (error) {
                console.error('Error in verifyForgotOtp:', error.message);
                throw error;
            }
        });
        this.changePassword = (password) => __awaiter(this, void 0, void 0, function* () {
            try {
                const email = this.email;
                if (!email) {
                    throw { statusCode: 400, message: 'mail is required' };
                }
                const hashPassword = yield bcrypt_1.default.hash(password, 10);
                const user = yield userRepository_1.UserRepository.changePassword(hashPassword, email);
                if (!user) {
                    throw { statusCode: 404, message: ' User not found ' };
                }
                return user;
            }
            catch (error) {
                throw { statusCode: error.statusCode || 500, message: error.message || 'Internal server Error' };
            }
        });
    }
}
exports.UserService = UserService;
