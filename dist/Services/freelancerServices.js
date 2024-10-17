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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreelancerService = void 0;
const awsFileConfig_1 = require("../Config/awsFileConfig");
const uuid_1 = require("uuid");
const freelancerRepository_1 = require("../Repository/freelancerRepository");
require('dotenv').config();
class FreelancerService {
    constructor() {
        this.awsConfig = new awsFileConfig_1.AwsConfig();
        this.freelancerApplicationService = (files, data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const bucketName = process.env.BUCKET_NAME;
                const fileUrls = [];
                if (files.photo) {
                    const url = yield this.awsConfig.uploadFile('freelancerApplication/photo', files.photo[0]);
                    fileUrls.push({ type: 'photo', url });
                }
                if (files.certification) {
                    for (const certificate of files.certification) {
                        const url = yield this.awsConfig.uploadFile('freelancerApplication/certification', certificate);
                        fileUrls.push({ type: 'certification', url });
                    }
                }
                const applicationId = (0, uuid_1.v4)();
                const wholeData = Object.assign(Object.assign({ applicationId }, data), { files: fileUrls });
                const freelancerData = yield freelancerRepository_1.FreelancerRepository.saveApplication(wholeData);
                console.log(freelancerData);
            }
            catch (error) {
                throw new Error(error.message || 'An error occured while processing the application');
            }
        });
    }
}
exports.FreelancerService = FreelancerService;
