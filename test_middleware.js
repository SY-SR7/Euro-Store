const http = require("http");
const loginData = JSON.stringify({ email: "eurostore.private@gmail.com", password: "<$t0rEeurOo>" });
const loginReq = http.request({
  host: "127.0.0.1", port: 3001, path: "/api/auth/login", method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(loginData) }
}, (res) => {
  console.log("Login Status:", res.statusCode);
  let cookieHeader = "";
  const cookies = res.headers["set-cookie"];
  if (cookies) {
    cookies.forEach((c) => {
      cookieHeader += c.split(";")[0] + "; ";
    });
  }
  
  const notifReq = http.request({
    host: "127.0.0.1", port: 3001, path: "/notifications", method: "GET",
    headers: { "Cookie": cookieHeader }
  }, (notifRes) => {
    console.log("Notif Status:", notifRes.statusCode);
    console.log("Location:", notifRes.headers["location"]);
  });
  notifReq.end();
});
loginReq.write(loginData);
loginReq.end();
