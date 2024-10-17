import express, { Application } from 'express';
import ConnectDB from './Config/databaseConfig';
import {createServer} from 'http';
import dotenv from 'dotenv';
import morgan from 'morgan'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRouter from './Routes/userRoutes';
import adminRouter from './Routes/adminRoutes';
import freelancerRouter from './Routes/freelancerRoutes'

dotenv.config();

const PORT = process.env.PORT;

ConnectDB();

const app : Application = express();
const server = createServer(app);

app.use(morgan('dev'));

const corsOptions = {
    origin: 'http://localhost:3000',
    Credential: true,
}

app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use('/',userRouter);
app.use('/admin',adminRouter);
app.use('/freelancer', freelancerRouter);

server.listen(PORT,()=>{
    console.log('server is running on port number',PORT);
});