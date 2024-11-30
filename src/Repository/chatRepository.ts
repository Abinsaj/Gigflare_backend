import Conversation from "../Models/conversationSchema";

export class ChatRepository{

    static async getConversation(recieverId: string, senderId: string){
        try {
            const conversation = await Conversation.findOne({
                participants:{$all:[senderId,recieverId]}
            })
            return conversation
        } catch (error) {
            console.log(error)
        }
    }

    static async createConversation(recieverId: string, senderId: string){
        try {
            let conversation = await Conversation.create({
                participants:[senderId,recieverId]
            })
            return conversation
        } catch (error) {
            console.log(error)
        }
    }

}