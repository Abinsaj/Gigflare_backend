import { Request, Response } from "express";
import { ChatService } from "../Services/chatService";
import HTTP_statusCode from "../Enums/httpStatusCode";


export class ChatController{

    private chatService: ChatService
    constructor(chatService: ChatService){
        this.chatService = chatService
    }

    getmessage = async(req: Request, res: Response)=>{
        try {
            console.log('its herereereerererere')
            const {id} = req.params 
            console.log(id,'this is the id we got here')
            const data = await this.chatService.getMessageService(id)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error: any) {
            console.log('Error in getMessage controller',error.message)
            res.status(HTTP_statusCode.InternalServerError).json({error: 'Internal server error'})
        }
    }

    getFreelancerMessage = async(req: Request, res: Response)=>{
        try {
            const {freelancerId,userId} = req.body 
            const data = await this.chatService.getFreelancerMessageService(userId, freelancerId)
            console.log(data)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error: any) {
            console.log('Error in getMessage controller',error.message)
            res.status(HTTP_statusCode.InternalServerError).json({error: 'Internal server error'})
        }
    }

    sendMessage = async(req: Request, res: Response)=>{
        try {
            const {message,userId} = req.body
            const {id}= req.params
            const data = await this.chatService.sendMessageService(userId,message,id)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error: any) {
            console.log('Error in sendMessage controller',error.message)
            res.status(HTTP_statusCode.InternalServerError).json({error: 'Internal server error'})
        }
    }

    sendFreelancerMessage = async(req: Request, res: Response)=>{
        try {
            const {message,id} = req.body
            const {receiverId}= req.params
            console.log(message,';;;;;;;;;',id,'.......',receiverId)
            const data = await this.chatService.sendFreelancerMessageService(receiverId,message,id)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error: any) {
            console.log('Error in sendMessage controller',error.message)
            res.status(HTTP_statusCode.InternalServerError).json({error: 'Internal server error'})
        }
    }

    getConversation = async(req: Request, res: Response)=>{
        try {
            const {id} = req.params
            const data = await this.chatService.getConversationService(id)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error: any) {
            console.log('Error in sendMessage controller',error.message)
            res.status(HTTP_statusCode.InternalServerError).json({error: 'Internal server error'})
        }
    }

    createConversation = async(req: Request, res: Response)=>{
        try {
            console.log('its herererererererererererer')
            const {userId}= req.body
            const {freelancerId} = req.body
            console.log(freelancerId, userId, 'these are the thing we got in backend')
            const data = await this.chatService.createConversationService(userId,freelancerId)
            res.status(HTTP_statusCode.OK).json(data)
        } catch (error: any) {
            console.log('Error in sendMessage controller',error.message)
            res.status(HTTP_statusCode.InternalServerError).json({error: 'Internal server error'})
        }
    }

    getFreelancerConversation = async(req: Request, res: Response)=>{
        try {
            try {
                const {id} = req.params
                const data = await this.chatService.getFreelancerConversationService(id)
                console.log(data,'this is the data')
                res.status(HTTP_statusCode.OK).json(data)
            } catch (error: any) {
                console.log('Error in sendMessage controller',error.message)
                res.status(HTTP_statusCode.InternalServerError).json({error: 'Internal server error'})
            }
        } catch (error) {
            
        }
    }

}