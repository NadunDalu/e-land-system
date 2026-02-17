const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'deed_documents',
        allowed_formats: ['pdf'],
        resource_type: 'raw', // Important for PDFs to be treated as files, not images if needed, but usually 'auto' or 'image' works for PDF previews. specific 'raw' or 'auto' is safer.
        // However, cloudinary usually handles pdfs as image-like resources if we want previews.
        // Let's use 'raw' or 'auto' to be safe for document storage.
        // Actually, distinct resource_type 'image' supports PDF pages. 'raw' is for arbitrary files.
        // If we want to use them as viewable documents, often 'auto' is best.
        // But for strict PDF storage, 'raw' is sometimes used.
        // Let's stick effectively to defaults or 'auto'.
        // NOTE: 'allowed_formats' is not supported in 'params' directly for all storage engines, but multer-storage-cloudinary uses it.
        // Let's use a simpler config.
        format: async (req, file) => 'pdf', // supports promises as well
        public_id: (req, file) => file.originalname.split('.')[0] + '-' + Date.now(),
    },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
