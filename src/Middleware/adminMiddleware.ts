import HTTP_statusCode from "../Enums/httpStatusCode";
import { NextFunction, Request, Response } from "express";
import jwt, { decode, JwtPayload } from "jsonwebtoken";
import { createToken } from "../Config/jwtConfig";
import dotenv from 'dotenv'
import userModel from "../Models/userSchema";

dotenv.config()

const secret_key = process.env.JWT_SECRET_KEY as string;

const verifyAdminToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken: string = req.cookies.AdminAccessToken;
        console.log('ACCESSTOKEN:',accessToken)
        if (accessToken) {
            jwt.verify(accessToken, secret_key, async (err, decoded) => {
                if (err) {
                    await handleRefreshToken(req, res, next);
                } else {
                    const { role } = decoded as jwt.JwtPayload;
                    if (role !== "Admin") {
                        return res.status(HTTP_statusCode.Unauthorized).json({ message: "Access Denied, Insufficient token payloads" });
                    }
                    next();
                };
            });
        } else {
            await handleRefreshToken(req, res, next);
        };

    } catch (error) {
        res.status(HTTP_statusCode.Unauthorized).json({ message: "Access Denied, token is not valid" });
    };
};

const handleRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const refreshToken: string = req.cookies.AdminRefreshToken;
        console.log(refreshToken)
        if (refreshToken) {
            jwt.verify(refreshToken, secret_key, (err, decode) => {
                if (err) {

                    return res.status(HTTP_statusCode.Unauthorized).json({ message: "Access Denied, Refresh token not valid" });
                } else {
                    const { user_id, role } = decode as jwt.JwtPayload;
                    if (!user_id || !role) {
                        return res.status(HTTP_statusCode.Unauthorized).json({ message: "Access Denied, Insufficient token payloads" });
                    } else {
                        const accessToken = createToken(user_id, role);
                        res.cookie('AdminAccessToken', accessToken, {
                            httpOnly: true,
                            sameSite: 'strict',
                            maxAge: 15 * 60 * 1000,
                            secure:true
                        });
                        console.log(accessToken)
                        next();
                    };
                };
            });
        } else {

            return res.status(HTTP_statusCode.Unauthorized).json({ message: "Access Denied, Refresh Token not provided" });
        };
    } catch (error) {

        res.status(HTTP_statusCode.Unauthorized).json(({ message: "Access Denied, token is not valid" }));
    };
};

export { verifyAdminToken }