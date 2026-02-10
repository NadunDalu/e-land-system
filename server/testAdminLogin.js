const axios = require('axios');

const testAdminLogin = async () => {
    try {
        console.log('🧪 Testing Admin Login...');

        // Try common admin credentials
        const testCredentials = [
            { username: 'admin', password: 'password123' },
            { username: 'admin', password: 'admin123' },
            { username: 'superadmin', password: 'password123' },
            { username: 'nadun', password: 'password123' } // potential user based on path
        ];

        for (const cred of testCredentials) {
            console.log(`\n--- Testing ${cred.username} ---`);

            try {
                const response = await axios.post('http://localhost:5000/api/auth/login', {
                    username: cred.username,
                    password: cred.password
                });

                console.log(`✅ SUCCESS: ${cred.username} logged in successfully`);
                console.log(`   Role: ${response.data.user.role}`);
                console.log(`   UserType: ${response.data.user.userType}`);
            } catch (error) {
                console.log(`❌ FAILED: ${error.response?.data?.message || error.message}`);
            }
        }

    } catch (error) {
        console.error('Test error:', error.message);
    }
};

testAdminLogin();
