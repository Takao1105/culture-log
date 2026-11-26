'use strict';
const pug = require('pug');
const Cookies = require('cookies');
const { currentThemeKey } = require('../config');

function handleLogout(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = cookies.get(currentThemeKey) || 'light';
  res.writeHead(401, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(pug.renderFile('./views/logout.pug', { currentTheme }));
}

function handleTopPage(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = cookies.get(currentThemeKey) || 'light';
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(pug.renderFile('./views/toppage.pug', { currentTheme }));
}


function handleNotFound(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = cookies.get(currentThemeKey) || 'light';
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(pug.renderFile('./views/404.pug', { currentTheme }));
}

function handleBadRequest(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = cookies.get(currentThemeKey) || 'light';
  res.writeHead(400, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(pug.renderFile('./views/400.pug', {
    method: req.method,
    currentTheme
  }));
}

function handleChangeTheme(req, res) {
  const cookies = new Cookies(req, res);
  const currentTheme = (cookies.get(currentThemeKey) !== 'light' ? 'light' : 'dark');
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  cookies.set(currentThemeKey, currentTheme, { maxAge });

  let redirectTo = '/posts';
  if (req.headers.referer) {
    try {
      const refererUrl = new URL(req.headers.referer);
      if (refererUrl.host === req.headers.host) {
        redirectTo = refererUrl.pathname;
      }
    } catch {
      // パース失敗時は '/posts' にフォールバック
    }
  }

  res.writeHead(303, {
    'Location': redirectTo
  });
  res.end();
}

module.exports = {
  handleLogout,
  handleChangeTheme,
  handleTopPage,
  handleNotFound,
  handleBadRequest,
};