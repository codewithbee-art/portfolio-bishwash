// Simple test to check if the contact API endpoint is reachable
async function testEndpoint() {
    try {
        console.log('🔍 Testing if /api/contact endpoint exists...');
        
        // Test with a simple GET request first
        const getResponse = await fetch('http://localhost:3000/api/contact', {
            method: 'GET'
        });
        
        console.log('GET Response status:', getResponse.status);
        
        // Test POST request
        const testData = {
            name: 'Test User',
            email: 'test@example.com',
            subject: 'Test Subject',
            message: 'This is a test message.'
        };
        
        console.log('🔍 Testing POST request...');
        const postResponse = await fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('POST Response status:', postResponse.status);
        const result = await postResponse.json();
        console.log('POST Response data:', result);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 Server is not running. Start the server first.');
        }
    }
}

testEndpoint();
