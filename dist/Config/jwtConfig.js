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
exports.verifyToken = exports.createRefreshToken = exports.createToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const httpStatusCode_1 = __importDefault(require("../Enums/httpStatusCode"));
dotenv_1.default.config();
const secret_key = process.env.JWT_SECRET_KEY;
const createToken = (user_id, role) => {
    return jsonwebtoken_1.default.sign({ user_id, role }, secret_key, { expiresIn: '10m' });
};
exports.createToken = createToken;
const createRefreshToken = (user_id, role) => {
    return jsonwebtoken_1.default.sign({ user_id, role }, secret_key, { expiresIn: "7d" });
};
exports.createRefreshToken = createRefreshToken;
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = req.cookies.AccessToken;
        if (accessToken) {
            jsonwebtoken_1.default.verify(accessToken, secret_key, (err, decoded) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    yield handleRefreshToken(req, res, next);
                }
                else {
                    const { role } = decoded;
                    if (role !== "user") {
                        return res.status(httpStatusCode_1.default.Unauthorized).json({ message: "Access Denied, Insufficient token payloads" });
                    }
                    next();
                }
                ;
            }));
        }
        else {
            yield handleRefreshToken(req, res, next);
        }
        ;
    }
    catch (error) {
        res.status(httpStatusCode_1.default.Unauthorized).json({ message: "Access Denied, token is not valid" });
    }
    ;
});
exports.verifyToken = verifyToken;
const handleRefreshToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refreshToken = req.cookies.RefresToken;
        if (refreshToken) {
            jsonwebtoken_1.default.verify(refreshToken, secret_key, (err, decode) => {
                if (err) {
                    return res.status(httpStatusCode_1.default.Unauthorized).json({ message: "Access Denied, Refresh token not valid" });
                }
                else {
                    const { user_id, role } = decode;
                    if (!user_id || !role) {
                        return res.status(httpStatusCode_1.default.Unauthorized).json({ message: "Access Denied, Insufficient token payloads" });
                    }
                    else {
                        const accessToken = createToken(user_id, role);
                        res.cookie('AccessToken', accessToken, {
                            httpOnly: true,
                            sameSite: 'strict',
                            maxAge: 15 * 60 * 1000
                        });
                        next();
                    }
                    ;
                }
                ;
            });
        }
        else {
            return res.status(httpStatusCode_1.default.Unauthorized).json({ message: "Access Denied, Refresh Token not provided" });
        }
        ;
    }
    catch (error) {
        res.status(httpStatusCode_1.default.Unauthorized).json(({ message: "Access Denied, token is not valid" }));
    }
    ;
});
