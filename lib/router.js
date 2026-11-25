'use strict';
const postsHandler = require('./posts-handler');
const util = require('./handler-util');
const fs = require('fs');
const path = require('path');

function route(req, res) {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] === 'http') {
    util.handleNotFound(req, res);
  }
  //imagesフォルダから該当の画像を返す
  if (req.url.startsWith('/images/')) {
    const filePath = `.${req.url}`; // 例: ./images/shining.jpg
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };

    fs.readFile(filePath, (err, data) => {
      if (err) {
        util.handleNotFound(req, res);
        return;
      }
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'image/jpeg' });
      res.end(data);
    });
    return;
  }

  switch (req.url) {
    case '/posts':
      postsHandler.handle(req, res);
      break;

    case '/posts/delete':
      postsHandler.handleDelete(req, res);
      break;

     case '/changeTheme':
      util.handleChangeTheme(req, res);
      break;

    case '/logout':
      util.handleLogout(req, res);
      break;

    default:
      util.handleNotFound(req, res);
      break;
  }
}

module.exports = {
  route
};