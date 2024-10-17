"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const databaseConfig_1 = __importDefault(require("./Config/databaseConfig"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const userRoutes_1 = __importDefault(require("./Routes/userRoutes"));
const adminRoutes_1 = __importDefault(require("./Routes/adminRoutes"));
const freelancerRoutes_1 = __importDefault(require("./Routes/freelancerRoutes"));
dotenv_1.default.config();
const PORT = process.env.PORT;
(0, databaseConfig_1.default)();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
app.use((0, morgan_1.default)('dev'));
const corsOptions = {
    origin: 'http://localhost:3000',
    Credential: true,
};
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use('/', userRoutes_1.default);
app.use('/admin', adminRoutes_1.default);
app.use('/freelancer', freelancerRoutes_1.default);
server.listen(PORT, () => {
    console.log('server is running on port number', PORT);
});
