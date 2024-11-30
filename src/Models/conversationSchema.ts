import mongoose, {Schema, ObjectId, Document, model} from 'mongoose'

export interface IConversation extends Document {
    participants: mongoose.Types.ObjectId[]; 
    messages: ObjectId[];
    lastMessage: string;
    createdAt?: Date; 
    updatedAt?: Date; 
  }

const conversationSchema = new Schema<IConversation>({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
      messages: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Message',
          default: [],
        },
      ],
      lastMessage: {
        type: String,
        default: '',
      },
    },
    {
      timestamps: true,
    }
    );

    conversationSchema.index({ 'participants.0': 1, 'participants.1': 1 }, { unique: true });



const Conversation = model<IConversation>('Conversation',conversationSchema)

export default Conversation;

