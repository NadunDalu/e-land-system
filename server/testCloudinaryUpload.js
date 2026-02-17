const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

const login = async () => {
    const credentials = [
        { username: 'admin', password: 'password123' },
        { username: 'admin', password: 'admin123' },
        { username: 'sadmin', password: 'sadmin2026' }
    ];

    for (const cred of credentials) {
        try {
            console.log(`Trying login with ${cred.username}...`);
            const res = await axios.post(`${API_URL}/auth/login`, cred);
            console.log(`✅ Login success with ${cred.username}`);
            return res.data.token;
        } catch (err) {
            console.log(`❌ Login failed with ${cred.username}/${cred.password}:`, err.response?.data?.message || err.message);
        }
    }
    console.error('❌ All login attempts failed.');
    process.exit(1);
};

const createDummyPdf = () => {
    const filePath = path.join(__dirname, 'test_deed.pdf');
    const content = `%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF`;
    fs.writeFileSync(filePath, content);
    return filePath;
};

const uploadDeed = async (token, filePath) => {
    const formData = new FormData();
    formData.append('landTitleNumber', `TEST-LT-${Date.now()}`);
    formData.append('deedNumber', `TEST-DEED-${Date.now()}`);
    formData.append('ownerName', 'Test Owner');
    formData.append('ownerNIC', '123456789V'); // Valid old NIC format
    formData.append('landLocation', 'Test Location');
    formData.append('province', 'Western');
    formData.append('district', 'Colombo');
    formData.append('landArea', '10 Perches');
    formData.append('surveyRef', `SV-${Date.now()}`);

    // Append file
    formData.append('document', fs.createReadStream(filePath));

    try {
        console.log('📤 Uploading deed...');
        // Need to calculate headers for form-data
        const headers = formData.getHeaders();
        headers['x-auth-token'] = token;

        const res = await axios.post(`${API_URL}/deeds`, formData, {
            headers: headers
        });
        console.log('✅ Upload Success!');
        console.log('Document URL:', res.data.documentUrl);
        console.log('Document Public ID:', res.data.documentPublicId);
        return res.data;
    } catch (err) {
        console.error('❌ Upload Failed:', err.response?.data || err.message);
    }
};

const run = async () => {
    console.log('🚀 Starting Cloudinary Upload Test...');
    const token = await login();

    const filePath = createDummyPdf();
    console.log('📄 Dummy PDF created');

    await uploadDeed(token, filePath);

    // Cleanup
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🧹 Cleanup done');
    }
};

run();
