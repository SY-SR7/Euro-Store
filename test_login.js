const http = require("http");
const loginData = JSON.stringify({ email: "eurostore.private@gmail.com", password: "<$t0rEeurOo>" });
const loginReq = http.request({
  host: "127.0.0.1", port: 3001, path: "/api/auth/login", method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginData) }
}, (res) => {
  console.log("Status:", res.statusCode);
  const cookies = res.headers["set-cookie"];
  console.log("Set-Cookie count:", cookies ? cookies.length : 0);
  if (cookies) cookies.forEach((c, i) => console.log("Cookie[" + i + "]: " + c.substring(0, 100)));
});
loginReq.write(loginData);
loginReq.end();
