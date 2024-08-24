const puppeteer = require("puppeteer-extra");
const { main: start } = require("./boss.cjs");

console.log('Starting script...');
// 确定当前目录
// const isPkg = typeof process.pkg !== 'undefined';
// const currentDir = isPkg ? path.dirname(process.execPath) : __dirname;
// const chromePath = path.join(currentDir, "./chrome/mac_arm-126.0.6478.182/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");

// process.env.CHROME_PATH = chromePath;

const helloTxt = `你好~~ 我是一个具备6年后端经验、5年前端经验的后端工程师。在过去的五年中，我曾在蚂蚁集团的证券和支付领域从事Java后端开发工作，积累了复杂分布式微服务系统下高可用、高并发架构设计的能力，同时具备金融级大数据开发的经验。 希望有机会可以详细了解一下`;

start({
  queryParams: {
    query: 'Java',
    city: '101280600',
    page: 1,
  },
  helloTxt: helloTxt,
  wt2Cookie: 'DH59AvmvERdu3_r2kI930MvdFyyaicRr8TIub54ODpN04KoXtiFz-BClADUofWZlsnRxxXkw0qLEsGbCNMYl46Q~~',
  targetNum: '5',
  salaryRange: [20, 50],
  timeout: "10000",
  headless: false,
  excludeCompanies: ['字节跳动', '蚂蚁', '蚂蚁集团', '字节', '腾讯', '阿里巴巴', '灵变', '灵变科技', 'Shopee', 'SHEIN', 'Xmind', '霏诺威云科技', '深圳霏诺威云科技', '霏诺威']
});
