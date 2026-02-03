const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// --- Shared Logic Function ---
// We extract the logic here so we can use it for both routes
const handleGetFolder = async (req, res) => {
    const { folderId } = req.params;
    const userId = req.user.id;

    let currentFolder = null;
    let path = [];
    
    // Check if we have a valid folderId (ignore 'null' or 'undefined' strings)
    const actualFolderId = (folderId && folderId !== 'null' && folderId !== 'undefined') ? folderId : null;

    if (actualFolderId) {
        // 1. Get Folder Metadata
        const { data: folder, error } = await supabase
            .from('folders')
            .select('*')
            .eq('id', actualFolderId)
            .eq('owner_id', userId)
            .single();
        
        if (error) return res.status(404).json({ error: 'Folder not found' });
        currentFolder = folder;

        // 2. Build Path (Breadcrumbs)
        // Try RPC if it exists, otherwise fallback to simple path
        try {
            const { data: pathData } = await supabase.rpc('get_folder_path', { folder_uuid: actualFolderId }); 
            if (pathData) path = pathData;
            else path = [{ id: actualFolderId, name: folder.name }];
        } catch (err) {
            path = [{ id: actualFolderId, name: folder.name }];
        }
    } else {
         path = [{ id: null, name: 'My Cloud' }];
    }

    // 3. Get Child Folders
    const { data: childFolders } = await supabase
        .from('folders')
        .select('*')
        .eq('owner_id', userId)
        .is('parent_id', actualFolderId) 
        .eq('is_deleted', false)
        .order('name');

    // 4. Get Child Files
    const { data: childFiles } = await supabase
        .from('files')
        .select('*')
        .eq('owner_id', userId)
        .is('folder_id', actualFolderId)
        .eq('is_deleted', false)
        .order('name');

    res.json({
        folder: currentFolder,
        childFolders: childFolders || [],
        childFiles: childFiles || [],
        path: path
    });
};

// --- THE FIX ---
// Register two separate routes instead of using optional regex

// 1. Route for Root (No ID provided)
router.get('/', handleGetFolder);

// 2. Route for Specific Folder (ID provided)
router.get('/:folderId', handleGetFolder);


// --- POST Route (Create Folder) ---
router.post('/', async (req, res) => {
    const { name, parentId } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
        .from('folders')
        .insert([{
            name,
            parent_id: parentId || null,
            owner_id: userId
        }])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

module.exports = router;