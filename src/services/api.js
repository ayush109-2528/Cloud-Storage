import axios from 'axios';
import { supabase } from '../supabaseClient';

const API_URL = 'http://localhost:5000/api';

// Helper to get current auth token
const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        headers: {
            Authorization: `Bearer ${session?.access_token}`
        }
    };
};

export const api = {
    getFolder: async (folderId) => {
        const config = await getAuthHeader();
        // Pass 'null' string if folderId is null
        const idParam = folderId || 'null';
        const res = await axios.get(`${API_URL}/folders/${idParam}`, config);
        return res.data; 
    },

    createFolder: async (parentId, name) => {
        const config = await getAuthHeader();
        const res = await axios.post(`${API_URL}/folders`, { name, parentId }, config);
        return res.data;
    },

    uploadFile: async (folderId, file) => {
        const config = await getAuthHeader();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', folderId || 'null');
        
        const res = await axios.post(`${API_URL}/files/upload`, formData, config);
        return res.data;
    }
};