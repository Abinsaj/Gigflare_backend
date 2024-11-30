import { Router } from "express";
import { ChatService } from "../Services/chatService";
import { ChatController } from "../Controllers/chatController";

const router = Router()

const chatService = new ChatService();
const chatController = new ChatController(chatService)

router.get('/conversations/:id',chatController.getConversation)
router.get('/:id',chatController.getmessage)
router.post('/send/:id',chatController.sendMessage)
router.post('/conversation',chatController.createConversation)
router.get('/message/:id',chatController.getmessage)


export default router