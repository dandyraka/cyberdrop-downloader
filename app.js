#!/usr/bin/env node
const _ = require('lodash');
const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');

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
      if (args[1] && args[1] === ('-d' || '--dir')) {
        if (!fs.existsSync(title)) {
          fs.mkdirSync(title);
        }
      }
      console.log(chalk.magentaBright(title));
      console.log(chalk.greenBright('Starting Download..'));
      let index = 0;
      function request() {
        const filetype = reqArr[index].split('.').pop();
        let filename = reqArr[index].slice(reqArr[index].lastIndexOf('/') + 1, reqArr[index].length);
        filename = filename.slice(0, filename.lastIndexOf('-'));
        return axios({
          method: 'GET',
          url: reqArr[index].replace('cyberdrop.nl', 'cyberdrop.cc'),
          responseType: 'stream',
          timeout: 60000,
          httpAgent: new http.Agent({ keepAlive: true }),
          httpsAgent: new https.Agent({ keepAlive: true }),
        }).then((resp) => {
          console.log(`${chalk.cyanBright(`[${(index + 1).toString().padStart(reqArr.length.toString().length, '0')}/${reqArr.length}]`)} ${filename}.${filetype}`);
          if (args[1] && args[1] === ('-d' || '--dir')) {
            resp.data.pipe(
              fs.createWriteStream(`${title}/${filename}.${filetype}`),
            );
          } else {
            resp.data.pipe(
              fs.createWriteStream(`${filename}.${filetype}`),
            );
          }
          index += 1;
          if (index >= reqArr.length) {
            return console.log(chalk.greenBright('Download Completed!'));
          }
          return request();
        });
      }
      return request();
    })
    .catch((error) => {
      console.log(error);
    });
}
