import axios from "axios";

async function run() {
  const baseURL = "http://localhost:3001/api/v1";
  console.log("Testing Backend API on " + baseURL);
  
  // 1. Health
  const health = await axios.get("http://localhost:3001/health");
  console.log("Health:", health.data);

  // 2. Auth signup
  const username = "testuser_" + Date.now();
  const password = "password123";
  const signupRes = await axios.post(`${baseURL}/user/signup`, { username, password });
  console.log("Signup:", signupRes.data);

  // 3. Auth signin
  const signinRes = await axios.post(`${baseURL}/user/signin`, { username, password });
  const token = signinRes.data.jwt;
  console.log("Signin token received:", !!token);

  // 4. Create website
  const siteRes = await axios.post(`${baseURL}/website`, { url: "https://google.com" }, {
    headers: { Authorization: token }
  });
  const siteId = siteRes.data.id;
  console.log("Created website ID:", siteId);

  // 5. Get status
  const statusRes = await axios.get(`${baseURL}/website/status/${siteId}`, {
    headers: { Authorization: token }
  });
  console.log("Website status response keys:", Object.keys(statusRes.data));
  if (!("ticks" in statusRes.data)) {
    throw new Error("ticks field missing from website status response");
  }

  // 6. Delete website
  const delRes = await axios.delete(`${baseURL}/website/${siteId}`, {
    headers: { Authorization: token }
  });
  console.log("Deleted website:", delRes.data);
  console.log("Backend API verification passed!");
}

run().catch((e) => {
  console.error("Test failed:", e.response?.data || e.message);
  process.exit(1);
});
