#!/usr/bin/env node
const _ = require('lodash');
const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');
const cheerio = require('cheerio');
const Multiprogress = require('multi-progress');
const axiosRetry = require('axios-retry');
const http = require('http');
const https = require('https');

const multi = new Multiprogress(process.stderr);
axiosRetry(axios, {
  retries: 10,
  retryDelay: axiosRetry.exponentialDelay,
});

const [, , ...args] = process.argv;
const url = args[0];

if (!url) {
  console.log(chalk.redBright('No URL Passed to Program'));
} else {
  axios.get(url)
    .then((response) => {
      const $ = cheerio.load(response.data);
      const reqArr = _.map($('.image'), (i) => i.attribs.href);
      const illegalChars = RegExp(/[\\/:"*?<>|]/g);
      const title = $('#title').attr('title').replace(illegalChars, '');
      if (!fs.existsSync(title)) {
        fs.mkdirSync(title);
      }
      console.log(chalk.magentaBright(title));
      console.log(chalk.greenBright('Starting Download..'));

      async function downloadImage(img, index) {
        const filetype = img.split('.').pop();
        let filename = img.slice(img.lastIndexOf('/') + 1, img.length);
        filename = filename.slice(0, filename.lastIndexOf('-'));
        const writer = fs.createWriteStream(`${title}/${filename}.${filetype}`);

        const { data, headers } = await axios({
          method: 'GET',
          url: img.replace('cyberdrop.nl', 'cyberdrop.cc'),
          responseType: 'stream',
          timeout: 60000,
          httpAgent: new http.Agent({ keepAlive: true }),
          httpsAgent: new https.Agent({ keepAlive: true }),
        });

        const totalLength = headers['content-length'];

        const bars = [];
        bars[index] = multi.newBar(`${chalk.cyanBright(`[${(index + 1).toString().padStart(reqArr.length.toString().length, '0')}/${reqArr.length}]`)} ${filename}.${filetype} -> [:bar] :percent :etas`, {
          width: 40,
          complete: '=',
          incomplete: ' ',
          total: Number.parseInt(totalLength, 10),
        });

        data.on('data', (chunk) => bars[index].tick(chunk.length));
        data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on('finish', () => {
            if (data.aborted) {
              console.log('aborted', img, index);
              reject();
            } else {
              resolve(true);
            }
          });
          writer.on('error', reject);
        });
      }

      // Sequential
      switch (args[1]) {
        case '-s':
        case '--sequential':
          // eslint-disable-next-line
          async function start () {
            for (let i = 0; i < reqArr.length; i++) {
              const element = reqArr[i];
              // eslint-disable-next-line no-await-in-loop
              await downloadImage(element, i);
            }
          }
          start();

          break;

        default:
          // Async
          // eslint-disable-next-line no-case-declarations
          const promises = [];
          for (let i = 0; i < reqArr.length; i++) { promises.push(downloadImage(reqArr[i], i)); }
          // promises.reduce((p, fn) => p.then(fn), Promise.resolve());
          Promise.all(promises)
            .then(() => {
              console.log(chalk.greenBright('Download Completed!'));
            })
            .catch((err) => {
              console.log(err);
            });
          break;
      }
    });
}
