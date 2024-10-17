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
exports.UserController = void 0;
const httpStatusCode_1 = __importDefault(require("../Enums/httpStatusCode"));
class UserController {
    constructor(userService) {
        this.createUser = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = req.body;
                yield this.userService.register(userData);
                res.status(httpStatusCode_1.default.OK).send({ success: true, message: 'OTP has send to the mail' });
            }
            catch (error) {
                res.status(httpStatusCode_1.default.Conflict).json({ success: false, message: error.message || "Registration Failed" });
            }
        });
        this.verifyOtp = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = req.body;
                yield this.userService.verifyOtp(data.email, data.otp);
                res.status(httpStatusCode_1.default.OK).send({ message: 'verified' });
            }
            catch (error) {
                if (error.message === 'Wrong OTP') {
                    res.status(httpStatusCode_1.default.Conflict).send({ message: 'Wrong OTP' });
                }
                else if (error.message === 'OTP expired or not found') {
                    res.status(httpStatusCode_1.default.BadRequest).send({ message: 'OTP expired or not found' });
                }
                else if (error.message === 'OTP has expired') {
                    res.status(httpStatusCode_1.default.BadRequest).send({ message: 'OTP has expired' });
                }
                else {
                    res.status(httpStatusCode_1.default.InternalServerError).send({ message: 'Internal server error' });
                }
            }
        });
        this.verifyLogin = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = req.body;
                const result = yield this.userService.login(data.email, data.password);
                if (!result) {
                    console.log('itanu problem........');
                    return res.status(httpStatusCode_1.default.Unauthorized).json({ success: false, message: "Invalid login credentials" });
                }
                res.cookie('AccessToken', result.accessToken, {
                    httpOnly: true,
                    sameSite: "strict",
                    maxAge: 15 * 60 * 1000,
                });
                res.cookie('RefreshToken', result.refreshToken, {
                    httpOnly: true,
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 10000
                });
                const { userInfo } = result;
                const cred = { userInfo };
                res.status(httpStatusCode_1.default.OK).json({ success: true, message: 'Login successful', cred });
            }
            catch (error) {
                res.status(httpStatusCode_1.default.InternalServerError).json({ success: false, message: error.message });
            }
        });
        this.resendOtp = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.userService.resendOtp();
                res.status(httpStatusCode_1.default.OK).send('OTP sended');
            }
            catch (error) {
                if (error.message == 'Email not send') {
                    res.status(httpStatusCode_1.default.InternalServerError).json({ message: "Email not send" });
                }
                else {
                    res.status(httpStatusCode_1.default.InternalServerError).json({ message: "Something went wrong..." });
                }
            }
        });
        this.verifyEmail = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                console.log(email, 'this is the email we got');
                const verify = yield this.userService.verifyEmailAndSendOTP(email);
                if (verify.bool) {
                    res.cookie('Email', verify.email, {
                        httpOnly: true,
                        sameSite: "strict",
                        maxAge: 15 * 60 * 1000,
                    });
                    res.status(httpStatusCode_1.default.OK).json('Email verified otp has sent');
                }
                else {
                    res.status(httpStatusCode_1.default.BadRequest).json({
                        message: 'Email verification failed or email not found.'
                    });
                }
            }
            catch (error) {
                res.status(httpStatusCode_1.default.InternalServerError).json(error.message);
            }
        });
        this.verifyForgotOtp = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { otpValue } = req.body;
                const result = yield this.userService.verifyForgotOtp(otpValue);
                console.log(' the result is ', result);
                if (result) {
                    console.log('hi......hlo');
                    res.status(httpStatusCode_1.default.OK).json('verified');
                }
                else {
                    res.status(httpStatusCode_1.default.BadRequest).json('Wrong OTP');
                }
            }
            catch (error) {
                res.status(httpStatusCode_1.default.InternalServerError).send('Internal server error');
            }
        });
        this.changePassword = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { password } = req.body;
                if (!password) {
                    res.status(httpStatusCode_1.default.BadRequest).json({ success: false, message: 'password is required' });
                }
                const result = yield this.userService.changePassword(password);
                res.status(httpStatusCode_1.default.OK).json({ success: true, message: 'Password changes successfully' });
            }
            catch (error) {
                res.status(error.statusCode || 500).json({ success: false, message: error.message || 'An error occured' });
            }
        });
        this.userService = userService;
    }
}
exports.UserController = UserController;
