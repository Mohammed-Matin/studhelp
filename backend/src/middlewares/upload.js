import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const bonafideStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'studhelp/bonafide',
        allowed_formats: ['pdf', 'png', 'jpg', 'jpeg'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    },
});

const galleryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'studhelp/gallery',
        allowed_formats: ['png', 'jpg', 'jpeg', 'webp'],
        transformation: [{ width: 1920, height: 1080, crop: 'limit' }],
    },
});

const imageOnlyFilter = (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg, .jpeg and .webp images are supported'), false);
    }
};

const docFilter = (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .pdf, .png, .jpg and .jpeg formats are supported'), false);
    }
};

export const bonafideUpload = multer({
    storage: bonafideStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: docFilter,
});

export const galleryUpload = multer({
    storage: galleryStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageOnlyFilter,
});

const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'studhelp/avatars',
        allowed_formats: ['png', 'jpg', 'jpeg', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
    },
});

export const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageOnlyFilter,
});

export default bonafideUpload;
