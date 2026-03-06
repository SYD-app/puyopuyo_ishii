const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
};

const ROOT = __dirname;

http.createServer((req, res) => {
    const filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
        } else {
            const ext = path.extname(filePath);
            res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
            res.end(data);
        }
    });
}).listen(3000, () => console.log('Server running on port 3000'));
