"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminControllers_1 = require("../Controllers/adminControllers");
const adminServices_1 = require("../Services/adminServices");
const router = (0, express_1.Router)();
const adminService = new adminServices_1.AdminService;
const adminController = new adminControllers_1.AdminController(adminService);
router.post('/verifyAdmin', adminController.verifyAdmin);
router.get('/getUsers', adminController.getUsers);
router.get('/getfreelancerapplications', adminController.getFreelancerApplication);
router.put('/updatefreelancerstatus/:applicationId', adminController.updateFreelancerStatus);
router.put('/blockfreelancer/:email', adminController.blockFreelancer);
router.put('/blockUser/:email', adminController.blockUser);
exports.default = router;