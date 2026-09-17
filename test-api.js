const https = require('https');
const data = JSON.stringify({
  requestUri: "https://paperx-xi.vercel.app",
  postBody: "",
  returnSecureToken: true,
  returnIdpCredential: true
});
const options = {
  hostname: 'identitytoolkit.googleapis.com',
  port: 443,
  path: '/v1/accounts:signInWithIdp?key=AIzaSyA3_012L7AqK5B14TJwtrQO4Va2dmbn-G8',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
req.write(data);
req.end();
