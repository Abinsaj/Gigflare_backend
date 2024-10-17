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
exports.FreelancerController = void 0;
const httpStatusCode_1 = __importDefault(require("../Enums/httpStatusCode"));
class FreelancerController {
    constructor(freelancerService) {
        this.verifyApplication = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('its herererer');
                const files = req.files;
                if (files) {
                    console.log("Uploaded files:", files);
                }
                else {
                    console.log("No files uploaded.");
                }
                const data = req.body;
                data.skills = JSON.parse(data.skills);
                data.experience = JSON.parse(data.experience);
                data.education = JSON.parse(data.education);
                if (files['photo']) {
                    data.photo = files['photo'][0];
                }
                data.certification = data.certification.map((cert, index) => {
                    const fileKey = `certification[${index}][file]`;
                    if (files[fileKey]) {
                        cert.file = files[fileKey][0];
                    }
                    return cert;
                });
                yield this.freelancerService.freelancerApplicationService(files, data);
                res.status(httpStatusCode_1.default.OK).json({ successs: true, message: 'Applicaiton submitted successfully' });
            }
            catch (error) {
                console.error("Error in tutor application controller:", error);
                res
                    .status(httpStatusCode_1.default.InternalServerError)
                    .json({ success: false, message: error.message || 'Internal Server Error' });
            }
        });
        this.freelancerService = freelancerService;
    }
}
exports.FreelancerController = FreelancerController;
