'use strict';
const fs = require('fs'); 
const pug = require('pug');
const Cookies = require('cookies');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query'] });
const util = require('./handler-util');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/ja');
dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.tz.setDefault('Asia/Tokyo');
const crypto = require('node:crypto');
const oneTimeTokenMap = new Map(); // キーをユーザ名、値をトークンとする連想配列

async function handle(req, res) { 
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });

      const cookies = new Cookies(req, res);
      const currentTheme = cookies.get('current_theme') || 'light';

// アクセスカウンター
      const counter = await prisma.accessCounter.upsert({
        where: { id: 1 },
        update: { count: { increment: 1 } },
        create: { id: 1, count: 1 }
      });

// 画像ファイルを取得してランダムに選ぶ
      const imageFiles = fs.readdirSync('./images').filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
      const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
      const logoUrl = `/images/${randomImage}`;

// 降順で取得する
      const posts = await prisma.post.findMany({
        orderBy: {
          id: 'desc'
        }
      });

// ループで各投稿に相対時間と絶対時間を持たせる
      for (const post of posts) {
        post.relativeCreatedAt = dayjs(post.createdAt).tz().fromNow();
        post.absoluteCreatedAt = dayjs(post.createdAt).tz().format('YYYY年MM月DD日 HH時mm分ss秒');
      }

// contents・logoUrl・user をまとめてPugへ渡す
      const oneTimeToken = crypto.randomBytes(8).toString('hex');
      oneTimeTokenMap.set(req.user, oneTimeToken);
      res.end(pug.renderFile('./views/posts.pug', { 
        contents: posts, 
        logoUrl, 
        user: req.user, 
        accessCount: counter.count,
        currentTheme,
        oneTimeToken
      }));
      break;

    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);

        // 投稿処理のチェック
        const content = params.get('content');
        const requestedOneTimeToken = params.get('oneTimeToken');
        if (!content) {
          handleRedirectPosts(req, res);
          return;
        }
        if (!requestedOneTimeToken) {
          util.handleBadRequest(req, res);
          return;
        }
        if (oneTimeTokenMap.get(req.user) !== requestedOneTimeToken) {
          util.handleBadRequest(req, res);
          return;
        }


        // 各項目を取得してオブジェクトにまとめる
        const post = {
          category: params.get('category'),
          rating: Number(params.get('rating')),
          title: params.get('title'),
          author: params.get('author'),
          content
        };

        console.info('送信されました:', post);

        // Prismaでデータベースに保存
        await prisma.post.create({
          data: {
            category: post.category,
            rating: post.rating,
            title: post.title,
            author: post.author,
            content: post.content,
            postedBy: req.user
          }
        });
        oneTimeTokenMap.delete(req.user); // 使い終わったトークンの削除
        handleRedirectPosts(req, res);
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

function handleDelete(req, res) {
  switch (req.method) {
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);

        // 削除処理のチェック
        const requestedOneTimeToken = params.get('oneTimeToken');
        if (!requestedOneTimeToken) {
          util.handleBadRequest(req, res);
          return;
        }
        if (oneTimeTokenMap.get(req.user) !== requestedOneTimeToken) {
          util.handleBadRequest(req, res);
          return;
        }



        const id = parseInt(params.get('id'));
        const requestedId = await prisma.post.findUnique({
          where: { id }
        });

//         if (!post) {
 //          util.handleBadRequest(req, res);
 //          return;
          if (requestedId && (req.user === requestedId.postedBy || req.user === 'admin')) {
            await prisma.post.delete({
              where: { id }
            });
            console.info(`削除されました: user: ${req.user}, id: ${id}`);
          }
          oneTimeTokenMap.delete(req.user); // 使い終わったトークン削除
          handleRedirectPosts(req, res);
        });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

module.exports = {
  handle,
  handleDelete,
};
