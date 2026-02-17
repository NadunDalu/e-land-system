const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';
const LOG_FILE = path.join(__dirname, 'test_output_internal.txt');

const log = (msg) => {
    console.log(msg);
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
    } catch (e) {
        // ignore logging errors
    }
};

// Clear log file
if (fs.existsSync(LOG_FILE)) {
    try {
        fs.unlinkSync(LOG_FILE);
    } catch (e) { }
}

const login = async () => {
    const credentials = [
        { username: 'admin', password: 'password123' },
        { username: 'admin', password: 'admin123' },
        { username: 'sadmin', password: 'sadmin2026' }
    ];

    for (const cred of credentials) {
        try {
            log(`Trying login with ${cred.username}...`);
            const res = await axios.post(`${API_URL}/auth/login`, cred);
            log(`✅ Login success with ${cred.username}`);
            return res.data.token;
        } catch (err) {
            log(`❌ Login failed with ${cred.username}/${cred.password}: ${err.response?.data?.message || err.message}`);
        }
    }
    log('❌ All login attempts failed.');
    process.exit(1);
};

const createDummyPdf = () => {
    const filePath = path.join(__dirname, 'test_deed_2.pdf');
    const content = `%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF`;
    fs.writeFileSync(filePath, content);
    return filePath;
};

const uploadDeed = async (token, filePath) => {
    const formData = new FormData();
    formData.append('landTitleNumber', `TEST-LT-2-${Date.now()}`);
    formData.append('deedNumber', `TEST-DEED-2-${Date.now()}`);
    formData.append('ownerName', 'Test Owner 2');
    formData.append('ownerNIC', '123456789V');
    formData.append('landLocation', 'Test Location 2');
    formData.append('province', 'Western');
    formData.append('district', 'Colombo');
    formData.append('landArea', '10 Perches');
    formData.append('surveyRef', `SV-2-${Date.now()}`);

    formData.append('document', fs.createReadStream(filePath));

    try {
        log('📤 Uploading deed...');
        // Correct way to get headers from form-data and add auth token
        const headers = formData.getHeaders();
        headers['Authorization'] = `Bearer ${token}`;

        const res = await axios.post(`${API_URL}/deeds`, formData, {
            headers: headers
        });
        log('✅ Upload Success!');
        log('Document URL: ' + res.data.documentUrl);
        log('Document Public ID: ' + res.data.documentPublicId);
        return res.data;
    } catch (err) {
        log(`❌ Upload Failed: ${err.response?.data?.message || err.message}`);
        if (err.response?.data) {
            log('Error Details: ' + JSON.stringify(err.response.data));
        }
    }
};

const run = async () => {
    log('🚀 Starting Cloudinary Upload Test 2...');
    const token = await login();

    const filePath = createDummyPdf();
    log('📄 Dummy PDF created: ' + filePath);

    await uploadDeed(token, filePath);

    // Cleanup
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log('🧹 Cleanup done');
    }
};

run();
