import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as crypto from 'crypto'

export class AwsConfig {
    private bucketName: string;
    private region: string;
    private s3client: S3Client;

    constructor() {
        this.bucketName = process.env.BUCKET_NAME!;
        this.region = process.env.BUCKET_REGION!;
        this.s3client = new S3Client({
            credentials: {
                accessKeyId: process.env.ACCESS_KEY!,
                secretAccessKey: process.env.SECRET_ACCESS_KEY!,
            },
            region: this.region
        });
    }

    async getFile(folder: string, fileName: string | undefined): Promise<string> {
        try {
          
            const getObjectParams = {
                Bucket: this.bucketName,
                Key: `${folder}/${fileName}`
            }
            console.log("path" , getObjectParams.Key );
            

            const getCommand = new GetObjectCommand(getObjectParams)
            const url = await getSignedUrl(this.s3client, getCommand, { expiresIn: 60 * 60})

            return url
        } catch (error) {
            throw new Error('Failed to generate signedUrl')
        }
    }

    async uploadFile(folderPath: string, file: Express.Multer.File): Promise<string> {
        try {
            let uniqueName = crypto.randomBytes(16).toString('hex')
            let fileBuffer: Buffer;
            let contentType: string;

            fileBuffer = file.buffer;
            contentType = file.mimetype;

            const params = {
                Bucket: this.bucketName,
                Key: `${folderPath}${uniqueName}`,
                Body: fileBuffer,
                contentType: contentType,
            }
            const command = new PutObjectCommand(params)
            const sent = await this.s3client.send(command)
            // const uploadedImage = await this.s3client.upload(params).promise();

            

            if (sent) {
                return `${uniqueName}`
            } else {
                throw new Error("Failed to sent image to s3")
            }
        } catch (error) {
            console.log('its here with error')
            throw new Error('Failed to upload to s3')
        }
    }
}