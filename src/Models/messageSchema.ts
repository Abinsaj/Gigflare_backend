import mongoose,{Schema, Document, ObjectId, model} from "mongoose";

export interface IMessage extends Document {
    sender: ObjectId; 
    receiver: ObjectId; 
    message: string;
    createdAt?: Date; 
    updatedAt?: Date; 
  }

const messageSchema = new Schema<IMessage>({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message:{
        type: String,
        required: true
    }
},{
    timestamps: true
})

const Message = model<IMessage>('Message', messageSchema)

export default Message