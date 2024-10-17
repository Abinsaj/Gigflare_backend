import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

const ConnectBD = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Database connected...")

    } catch (error: any) {
        console.log('Database does not connected', error.message)
    }
}

export default ConnectBD