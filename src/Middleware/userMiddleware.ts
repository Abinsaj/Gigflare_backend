import dotenv from 'dotenv'
import HTTP_statusCode from '../Enums/httpStatusCode'
import { Request, Response, NextFunction } from 'express'
import { createToken } from '../Config/jwtConfig'
import jwt, { decode, Jwt } from 'jsonwebtoken'
import userModel from '../Models/userSchema'

const secret_key = process.env.JWT_SECRET_KEY as string;

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken: string = req.cookies.UserAccessToken;
        console.log(accessToken)
        if (accessToken) {
            jwt.verify(accessToken, secret_key, async (err: any, decoded: any) => {
                if (err) { 
                    await handleRefreshToken(req, res, next)
                } else {
                    const { user_id, role, isBlocked } = decoded as jwt.JwtPayload
                    if (role !== "user") {
                        res.status(HTTP_statusCode.Unauthorized).json({ message: 'Accesss Denied, Insufficient token payloads' })
                    } else {
                        const userData = await userModel.findOne({userId:user_id})
                        if(userData?.isBlocked == true){
                            res.status(HTTP_statusCode.NoAccess).json({ message: 'Access Denied, You are blocked' })
                        }else{
                            next();
                        }
                    }
                }
            })
        } else {
            await handleRefreshToken(req, res, next);
        }
    } catch (error) {
        res.status(HTTP_statusCode.Unauthorized).json({ message: "Access Denied, token is not valid" });
    }
}

const handleRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken: string = req.cookies.UserRefreshToken;
        if (refreshToken) {
            jwt.verify(refreshToken, secret_key, async (err: any, decoded: any) => {
                if (err) {
                    res.status(HTTP_statusCode.Unauthorized).json({ message: 'Accesss Denied, Refresh token not valid' })
                } else {
                    const { user_id, role } = decoded as jwt.JwtPayload;
                    if (!user_id && !role) {
                        res.status(HTTP_statusCode.Unauthorized).json({ message: 'Accesss Denied, Insufficient payloads' })
                    } else if (role !== 'user') {
                        res.status(HTTP_statusCode.Unauthorized).json({ message: 'Accesss Denied, Insufficient refresh payloads' })
                    } else {
                        const userData = await userModel.findOne({ userId: user_id })
                        if (userData?.isBlocked == true) {
                            res.status(HTTP_statusCode.NoAccess).json({ message: 'Accesss Denied, You are blocked' })
                        } else {
                            const accessToken = createToken(user_id, role)
                            res.cookie('UserAccessToken', accessToken, {
                                httpOnly: true,
                                sameSite: "none",
                                secure: true,
                                maxAge: 15 * 60 * 1000
                            });
                         
                            next();
                        }
                    }
                }
            })
        } else {
            res.status(HTTP_statusCode.Unauthorized).json({ message: 'No Refresh token' })
        }
    } catch (error) {
        res.status(HTTP_statusCode.Unauthorized).json(({ message: "Access Denied, token is not valid" }));
    }
}

export default verifyToken