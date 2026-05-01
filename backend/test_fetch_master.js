const http = require('http');

http.get('http://localhost:3000/api/gallery/master/23c522f1-c642-46dd-a8fc-7b006a367066', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(JSON.parse(data)); });
}).on('error', (err) => { console.log("Error: " + err.message); });
