const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/gallery/master/23c522f1-c642-46dd-a8fc-7b006a367066',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let data = '';
  res.on('data', d => { data += d; });
  res.on('end', () => { console.log(data); });
});

req.on('error', error => { console.error(error); });
req.end();
