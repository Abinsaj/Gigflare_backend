import mongoose, {Schema, model, Document, ObjectId} from "mongoose";
import { INotification } from "../Interfaces/common.interface";

const notificationShema = new Schema<INotification>({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    type:{
        type: String,
        enum: ['message','proposal','offer','contract'],
        required: true,
    },
    message:{
        type: String,
        required: true
    },
    data:{
        type:Schema.Types.Mixed,
    },
    isRead:{
        type:Boolean,
        default: false
    }
},{
    timestamps: true
})

const NotificationModel = mongoose.model<INotification>('Notification', notificationShema)

export default NotificationModel;