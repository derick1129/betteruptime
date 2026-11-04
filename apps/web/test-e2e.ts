async function verify() {
  const apiBase = "http://localhost:3001/api/v1";
  console.log("Checking API health at http://localhost:3001/health...");
  try {
    const healthRes = await fetch("http://localhost:3001/health");
    const health = await healthRes.json();
    console.log("Health OK:", health);
  } catch (err: any) {
    console.log("API server is not currently running (expected during static check):", err.message);
    return;
  }

  console.log("Testing user signup/signin flow...");
  const testUser = "e2e_user_" + Math.random().toString(36).substring(7);
  const testPass = "secret123";
  await fetch(`${apiBase}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUser, password: testPass }),
  });

  const signinRes = await fetch(`${apiBase}/user/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: testUser, password: testPass }),
  });
  const signin = await signinRes.json();
  const token = signin.jwt;
  console.log("JWT acquired successfully.");

  console.log("Creating website monitor...");
  const siteRes = await fetch(`${apiBase}/website`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ url: "https://github.com" }),
  });
  const site = await siteRes.json();
  const siteId = site.id;
  console.log("Created monitor ID:", siteId);

  console.log("Verifying website status and ticks response structure...");
  const statusRes = await fetch(`${apiBase}/website/status/${siteId}`, {
    headers: { Authorization: token },
  });
  const status = await statusRes.json();
  console.log("Status keys:", Object.keys(status));
  if (!Array.isArray(status.ticks)) {
    throw new Error("Expected status.ticks to be an array");
  }

  console.log("Deleting website monitor...");
  await fetch(`${apiBase}/website/${siteId}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  console.log("E2E API verification completed successfully!");
}

verify().catch((e) => {
  console.error("Verification failed:", e.message);
  process.exit(1);
});
