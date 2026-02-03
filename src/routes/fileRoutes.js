const express = require('express');
const router = express.Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/auth');

// Setup Multer (RAM storage for immediate upload)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.use(requireAuth);

// POST /api/files/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { folderId } = req.body;
        const userId = req.user.id;
        
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        // 1. Upload to Supabase Storage
        // Path format: userId/timestamp-filename
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('user_files') // Make sure this bucket exists!
            .upload(filePath, file.buffer, {
                contentType: file.mimetype
            });

        if (storageError) throw storageError;

        // 2. Insert Metadata into DB
        const { data: dbData, error: dbError } = await supabase
            .from('files')
            .insert([{
                name: file.originalname,
                size_bytes: file.size,
                mime_type: file.mimetype,
                storage_key: filePath,
                folder_id: folderId === 'null' ? null : folderId,
                owner_id: userId
            }])
            .select()
            .single();

        if (dbError) throw dbError;

        res.status(201).json(dbData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;