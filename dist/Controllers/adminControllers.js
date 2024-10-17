"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const httpStatusCode_1 = __importDefault(require("../Enums/httpStatusCode"));
class AdminController {
    constructor(adminService) {
        this.verifyAdmin = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('its here');
                const { email, password } = req.body;
                console.log(email, password);
                const data = yield this.adminService.verifyAdmin(email, password);
                res.status(httpStatusCode_1.default.OK).json({ message: 'Admin login succesful', data });
            }
            catch (error) {
                res.status(httpStatusCode_1.default.InternalServerError).json({ message: error.message });
            }
        });
        this.getUsers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield this.adminService.getUsersListService();
                res.status(httpStatusCode_1.default.OK).json(users);
            }
            catch (error) {
                res.status(httpStatusCode_1.default.BadRequest).json(error.message);
            }
        });
        this.getFreelancerApplication = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.adminService.getFreelancerApplicaitonService();
                if (!data) {
                    res.status(httpStatusCode_1.default.BadRequest).json('No data in the database');
                }
                else {
                    res.status(httpStatusCode_1.default.OK).json({ message: 'data fetched successfully', data });
                }
            }
            catch (error) {
                res.status(httpStatusCode_1.default.BadRequest).json(error);
            }
        });
        this.updateFreelancerStatus = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('its here');
                console.log(req.params);
                console.log(req.body);
                const { applicationId } = req.params;
                const { status } = req.body;
                yield this.adminService.updateFreelancerService(applicationId, status);
                res.status(httpStatusCode_1.default.OK).json({ message: 'Freelancer status updated successfully' });
            }
            catch (error) {
                res.status(httpStatusCode_1.default.BadRequest).json(error);
            }
        });
        this.blockFreelancer = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.params;
                const { isBlocked } = req.body;
                yield this.adminService.blockFreelancerService(email, isBlocked);
                res.status(httpStatusCode_1.default.OK).json('user blocked');
            }
            catch (error) {
                res.status(httpStatusCode_1.default.BadRequest).json(error.message);
            }
        });
        this.blockUser = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(req.body);
                const { email } = req.params;
                const { isBlocked } = req.body;
                yield this.adminService.blockUserService(email, isBlocked);
                res.status(httpStatusCode_1.default.OK).json('user blocked');
            }
            catch (error) {
                res.status(httpStatusCode_1.default.BadRequest).json(error.message);
            }
        });
        this.adminService = adminService;
    }
}
exports.AdminController = AdminController;
