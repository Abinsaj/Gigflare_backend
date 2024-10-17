"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const freelancerControllers_1 = require("../Controllers/freelancerControllers");
const freelancerServices_1 = require("../Services/freelancerServices");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const freelancerService = new freelancerServices_1.FreelancerService();
const freelancerController = new freelancerControllers_1.FreelancerController(freelancerService);
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
const flexibleUpload = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'certification', maxCount: 5 },
    { name: 'certification[0][file]', maxCount: 1 },
    { name: 'certification[1][file]', maxCount: 1 },
]);
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ error: 'File upload error', details: err.message });
    }
    next(err);
};
router.post('/application', flexibleUpload, handleMulterError, freelancerController.verifyApplication);
exports.default = router;
