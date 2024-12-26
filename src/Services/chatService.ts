import { ObjectId } from "mongoose"
import Conversation from "../Models/conversationSchema"
import Message from "../Models/messageSchema"
import { getRecieverSocketId } from "../server"
import {io} from '../server'
import NotificationModel from "../Models/notificationSchema"
import userModel from "../Models/userSchema"

export class ChatService {

    getMessageService = async (id: string) => {
        try {
            const conversation = await Conversation.findOne({_id:id}).populate('messages')
            if (!conversation) {
                return []
            }
            return conversation?.messages
        } catch (error: any) {
            throw new Error(error.message || 'Couldnt fetch the data')
        }
    }

    getFreelancerMessageService = async (sender: string, receiver: string) => {
        try {
            console.log(sender,'.......', receiver)
            const conversation = await Conversation.findOne({
                sender:sender,
                receiver:receiver
            }).populate('messages')
            if (!conversation) {
                return []
            }
            console.log(conversation)
            return conversation?.messages
        } catch (error: any) {
            throw new Error(error.message || 'Couldnt fetch the data')
        }
    }

    sendMessageService = async (sender: string, message: string, receiver: string) => {
        try { 
            console.log(sender,receiver,'these are the id we got herererrerer in the function')
            let conversation = await Conversation.findOne({
                participants:{$all:[sender,receiver]}
            })

            if (!conversation) {
                conversation = await Conversation.create({
                    participants:[sender,receiver],
                    messages: []
                })
            }
            const newMessage = new Message({
                sender,
                receiver,
                message,
            })
            await newMessage.save()
            if (newMessage) {
                conversation.messages.push(newMessage._id as ObjectId)
            }
            const userDetails = await userModel.findOne({_id: sender})
            const messageNotification = await NotificationModel.create({
                userId: receiver,
                type: 'message',
                message: `New message from ${userDetails?.name}`,
                data: newMessage
            })

            const receiverSocketId = getRecieverSocketId(receiver);
            if(receiverSocketId){
                io.to(receiverSocketId).emit('newMessage',newMessage)
                io.to(receiverSocketId).emit('notifications',messageNotification)
            }

            await conversation.save()
            return newMessage

        } catch (error: any) {
            throw new Error(error.message || 'An unexpected error has occured')
        }
    }

    sendFreelancerMessageService = async (receiver: string, message: string, sender: string) => {
        try {
          console.log(receiver, sender, 'this is what we got here');
          
          let conversation = await Conversation.findOneAndUpdate(
            {
              $or: [
                { sender, receiver },
                { sender: receiver, receiver: sender },
              ],
            },
            { $setOnInsert: { sender, receiver, messages: [] } },
            { upsert: true, new: true } 
          ).populate('messages'); 
      

          const newMessage = new Message({
            sender,
            receiver,
            message,
          });
      
          await newMessage.save();
      
  
          if (newMessage) {
            conversation.messages.push(newMessage._id as ObjectId);
          }
      
          await conversation.save();

          const receiverSocketId = getRecieverSocketId(receiver);
          if(receiverSocketId){
            io.to(receiverSocketId).emit('newMessage',newMessage)
          }

          return newMessage;
        } catch (error: any) {
          console.error('Error sending message:', error);
          throw new Error(error.message || 'An unexpected error has occurred');
        }
      };

    getConversationService = async (id: string) => {
        try {
            console.log(id,'this is the id')
            const conversations = await Conversation.find({
                participants: { $in: [id] }
            })
                .populate('participants')
                .sort({ updatedAt: -1 });

                console.log(conversations,'this is the conversations')
            return conversations;
        } catch (error: any) {
            throw new Error(error.message || 'An unexpected error has occurred');
        }
    };


    createConversationService = async (sender: string, receiver: string) => {
        try {
            const participants = [sender, receiver].sort(); 
    
            console.log(participants, 'this is the sorted ids of user and freelancer');
    
            let conversation = await Conversation.findOne({
                participants,
            }).populate('participants');
    
            if (!conversation) {
                console.log('Creating a new conversation...');
                conversation = new Conversation({ participants });
                await conversation.save();

                let recieverSocketId = getRecieverSocketId(receiver)

                if(recieverSocketId){
                    io.to(recieverSocketId).emit('conversation',conversation)
                }

                return conversation;
            }
    
            return conversation; 
        } catch (error: any) {
            console.log(error);
            if (error.code === 11000) {
                console.error('Duplicate conversation detected.');
    
                return await Conversation.findOne({
                    participants: [sender, receiver].sort(), 
                }).populate('participants');
            }
    
            throw new Error(error.message || 'An unexpected error occurred');
        }
    };
    

    getFreelancerConversationService = async(id: string)=>{
        try {
            console.log(id,'this is the id')
            const conversations = await Conversation.find({ receiver: id })
                .populate('sender')
                .populate('receiver')
                .sort({ updatedAt: -1 });

            
            return conversations;
        } catch (error: any) {
            throw new Error(error.message || 'An unexpected error has occurred');
        }
    }


}