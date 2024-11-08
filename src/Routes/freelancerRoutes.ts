import { Router } from "express";
import { FreelancerController } from "../Controllers/freelancerControllers";
import { FreelancerService } from "../Services/freelancerServices";
import multer from "multer";

const router = Router();

const freelancerService = new FreelancerService();
const freelancerController = new FreelancerController(freelancerService);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const flexibleUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certification', maxCount: 5 }, 
  
]);


const handleMulterError = (err: any, req:any, res:any, next:any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload error', details: err.message });
  }
  next(err);
};

router.post('/application/:userId',flexibleUpload,handleMulterError,freelancerController.verifyApplication);
router.get('/getDetails/:id',freelancerController.getSingleDetails)
router.get('/getJobDetails',freelancerController.getJobDetails)

export default router;