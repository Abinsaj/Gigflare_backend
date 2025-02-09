import mongoose,{Schema, ObjectId, model, Document} from "mongoose";
import { ISkill } from "../Interfaces/common.interface";



const skillSchema = new Schema<ISkill>({
    name: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    isBlocked:{
        type: Boolean,
        default: false
    }
},{
    timestamps: true    
})

const SkillSchema = model<ISkill>('Skill',skillSchema)

export default SkillSchema;