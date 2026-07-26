const NUM_REQUESTS = 500;
const PROBLEM_ID = "6a5d0a6c2f2b5bb44ea3a844"; 
const AUTH_COOKIE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTMwZWVlY2RhY2VkMTNiMzBiNmVkNjciLCJlbWFpbCI6ImFuaWtldDE3MjZAZ21haWwuY29tIiwidXNlcm5hbWUiOiJhbmlrZXQxNzI2Iiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzg0NDg0OTY2LCJleHAiOjE3ODQ1NzEzNjZ9.hP7qszjeoRcrVH8_UI63uxTiJFntYzSxH7DHmK_4aVM"; 

const payload = {
    problemId: PROBLEM_ID,
    language: "python",
    code: "print('1')\n" 
};

async function sendSubmission(i) {
    const start = Date.now();
    try {
        const response = await fetch("http://localhost:8000/api/v1/submissions/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `accessToken=${AUTH_COOKIE}` 
            },
            body: JSON.stringify(payload)
        });
        
        const timeTaken = Date.now() - start;
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ [Req ${i}] Finished in ${timeTaken}ms | Verdict: ${data.data?.verdict}`);
        } else {
            console.log(`❌ [Req ${i}] Failed in ${timeTaken}ms | Status: ${response.status}`);
        }
    } catch (error) {
        console.log(`💥 [Req ${i}] Server Connection Crashed: ${error.message}`);
    }
}

async function runTest() {
    console.log(`\n🚀 FIRING ${NUM_REQUESTS} CONCURRENT SUBMISSIONS AT THE ENGINE...\n`);
    
    const requests = [];
    for (let i = 1; i <= NUM_REQUESTS; i++) {
        requests.push(sendSubmission(i));
    }
    
    await Promise.all(requests);
    console.log(`\n🏁 ALL ${NUM_REQUESTS} REQUESTS COMPLETED.`);
}

runTest();