import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage locations relative to the project root
const storagePaths = {
  profiles: path.join(__dirname, '../../uploads/profiles'),
  products: path.join(__dirname, '../../uploads/products'),
  documents: path.join(__dirname, '../../uploads/documents')
};

// Ensure all storage directories exist
Object.values(storagePaths).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest;
    // Route file to the correct folder based on the HTML input 'name' attribute
    switch (file.fieldname) {
      case 'profileImage':
        dest = storagePaths.profiles;
        break;
      case 'productImage':
        dest = storagePaths.products;
        break;
      case 'document':
        dest = storagePaths.documents;
        break;
      default:
        dest = path.join(__dirname, '../../uploads/others'); // Fallback directory
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Sanitize filename and ensure uniqueness
    const originalName = file.originalname.replace(/\s+/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user._id}-${uniqueSuffix}-${originalName}`);
  }
});

const uploader = multer({ storage });

export default uploader;
