"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.AwsConfig = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto = __importStar(require("crypto"));
class AwsConfig {
    constructor() {
        this.bucketName = process.env.BUCKET_NAME;
        this.region = process.env.BUCKET_REGION;
        this.s3client = new client_s3_1.S3Client({
            credentials: {
                accessKeyId: process.env.ACCESS_KEY,
                secretAccessKey: process.env.SECRET_ACCESS_KEY,
            },
            region: this.region
        });
    }
    getFile(fileName, folder) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const getObjectParams = {
                    Bucket: this.bucketName,
                    Key: `${folder}/${fileName}`
                };
                const getCommand = new client_s3_1.GetObjectCommand(getObjectParams);
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(this.s3client, getCommand, { expiresIn: 60 * 60 });
                return url;
            }
            catch (error) {
                throw new Error('Failed to generate signedUrl');
            }
        });
    }
    uploadFile(folderPath, file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let uniqueName = crypto.randomBytes(16).toString('hex');
                let fileBuffer;
                let contentType;
                fileBuffer = file.buffer;
                contentType = file.mimetype;
                const params = {
                    Bucket: this.bucketName,
                    Key: `${folderPath}${uniqueName}`,
                    Body: fileBuffer,
                    contentType: contentType,
                };
                const command = new client_s3_1.PutObjectCommand(params);
                const sent = yield this.s3client.send(command);
                if (sent) {
                    return uniqueName;
                }
                else {
                    throw new Error("Failed to sent image to s3");
                }
            }
            catch (error) {
                throw new Error('Failed to upload to s3');
            }
        });
    }
}
exports.AwsConfig = AwsConfig;
