import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ConnectDB from './Config/databaseConfig';
import userRouter from './Routes/userRoutes';
import adminRouter from './Routes/adminRoutes';
import chatRouter from './Routes/chatRoutes';
import freelancerRouter from './Routes/freelancerRoutes';
import bodyParser = require('body-parser');
import session = require('express-session');
import { errorLogStream } from './Config/loggerConfig';
import HTTP_statusCode from './Enums/httpStatusCode';

dotenv.config();
const PORT = process.env.PORT;

ConnectDB();

const app: Application = express();


const server = createServer(app);

app.use(
  morgan('combined',{
    stream: errorLogStream,
    skip: (req: Request, res: Response) => res.statusCode < HTTP_statusCode.BadRequest,
  })
)

export const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(morgan('dev'));
app.use(cookieParser());


const corsOptions = {
  origin:'http://localhost:3000',
  credentials: true,
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/freelancer', freelancerRouter);
app.use('/chat', chatRouter);

export const getRecieverSocketId = (recieverId: any)=>{
    console.log(recieverId,'this is the resciever id we got inside the function')
    console.log(userSocketMap[recieverId],'this is the socket id of the user we got here')
    return userSocketMap[recieverId]
}

const userSocketMap:any = {}

io.on('connect', (socket) => {
  console.log('A user connected:', socket.id);

  const userId: any = socket.handshake.query.userId
  if(userId != undefined)userSocketMap[userId]= socket.id
  console.log(userSocketMap,'this is the socket id we store in the socket map')

  // io.emit('getOnlineUsers',Object.keys(userSocketMap))

  socket.on('message', (data) => {
    console.log('Message received:', data);
    io.emit('message', data);
  });


  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete userSocketMap[userId]
    io.emit('getOnlineUsers',Object.keys(userSocketMap))
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port number ${PORT}`);
});
