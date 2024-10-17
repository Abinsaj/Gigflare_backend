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
exports.UserRepository = void 0;
const userSchema_1 = __importDefault(require("../Models/userSchema"));
class UserRepository {
    static existUser(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existUser = yield userSchema_1.default.findOne({ email });
                return existUser;
            }
            catch (error) {
                throw new Error('Database query failed');
            }
            ;
        });
    }
    ;
    static createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newUser = new userSchema_1.default(userData);
                return yield newUser.save();
            }
            catch (error) {
                console.log('Error in creating new user');
                throw new Error(`Error in creating user : ${error.message}`);
            }
        });
    }
    static verifyLogin(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Ithu ivida ethikku too');
                const user = yield userSchema_1.default.findOne({ email }, {
                    _id: 0,
                    userId: 1,
                    name: 1,
                    email: 1,
                    password: 1,
                    phone: 1,
                    isBlocked: 1,
                });
                return user;
            }
            catch (error) {
                throw new Error('verify login failed');
            }
        });
    }
    static getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield userSchema_1.default.find({}, {
                    _id: 0,
                    userId: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    created_At: 1,
                    isFreelancer: 1,
                    isBlocked: 1,
                });
                console.log(users);
                return users;
            }
            catch (error) {
                throw new Error('failed to fetch users list from the db');
            }
        });
    }
    static verifyEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Hi ivida inda ');
                const user = yield userSchema_1.default.findOne({ email });
                if (!user) {
                    return false;
                }
                else {
                    return true;
                }
            }
            catch (error) {
                throw new Error('error verifying the email');
            }
        });
    }
    static changePassword(password, email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userSchema_1.default.findOneAndUpdate({ email: email }, { password: password }, { new: true });
                if (!user) {
                    throw new Error('User not found');
                }
                return user;
            }
            catch (error) {
                console.log('error updating password in the repository', error);
                throw new Error('Database Operation Failed');
            }
        });
    }
    static blockFreelancer(email, isBlocked) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userSchema_1.default.findOne({ email });
                if (!user) {
                    throw new Error('no user have found');
                }
                else {
                    user.isBlocked = isBlocked;
                    console.log('the blocked freelancer is', user);
                    yield user.save();
                    return true;
                }
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    static blockUser(email, isBlocked) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userSchema_1.default.findOne({ email });
                console.log(user);
                if (!user) {
                    throw new Error('no user have found');
                }
                else {
                    user.isBlocked = isBlocked;
                    console.log('the blocked freelancer is', user);
                    yield user.save();
                    return true;
                }
            }
            catch (error) {
            }
        });
    }
}
exports.UserRepository = UserRepository;
