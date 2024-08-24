/**
 * 细节：
 * 1. 公司下存在多个职位，名字可能是一样的，但岗位要求不一样；
 * 1.1 区分是否投递过，简单方法就是列表、详情页的“继续沟通”文案；
 * 2. 选择器拿不到，可能是出现“安全问题”弹窗；$$、$、$eval、page.click 等可能会失败
 * 3. arms-retcode.aliyuncs.com/r.png 这个请求 window 本地也会失败
 *
 * 4. 遇到问题，以 headless=false 进行调试
 */

const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");

puppeteer.use(stealthPlugin());

let browser;
let marketPage;

let logs = [];
let ignoreNum = 0;
let onetimeStatus = {
  initMarketPage: false,
  checkSafeQues: false,
  checkLogin: false,
};
let textareaSelector = "";
let queryParams = {}; // { page, query, experience, salary }, 只用到 page

let helloTxt = "";
let cookies = [
  {
    name: "wt2",
    value: "",
    domain: ".zhipin.com",
    httpOnly: true,
    secure: true,
  },
  {
    name: "wbg",
    value: "0",
    domain: ".zhipin.com",
    httpOnly: true,
    secure: true,
  },
];
let targetNum;
let timeout = 5000;
let salaryRange = [0, Infinity];
let keySkills = [];
// let jobUpdateTime = 0;
let excludeCompanies = [];
let excludeJobs = [];

let headless = "new";
let openNewTabTime = 5000;

// 读取已投递公司存储，执行 main；
async function start(conf = {}) {
  ({
    queryParams = {},
    helloTxt = "",
    wt2Cookie = "",
    targetNum = 2,
    timeout = 5000,
    salaryRange = [0, Infinity],
    keySkills = [],
    excludeCompanies = [],
    excludeJobs = [],
    headless = "new",
  } = conf);

  cookies[0].value = wt2Cookie;

  [keySkills, excludeCompanies, excludeJobs] = [
    keySkills,
    excludeCompanies,
    excludeJobs,
  ].map((list) => list.map((item) => item.toLowerCase()));

  resetOnetimeStatus();

  try {
    myLog(`⏳ 自动打招呼进行中, 本次目标: ${targetNum}; 请耐心等待`);

    await main(queryParams.page);

    myLog("✨ 任务顺利完成！");
  } catch (error) {
    myLog("当前页码", queryParams.page);
    myLog("📊 未投递岗位数：", targetNum, "；略过岗位数：", ignoreNum);
    myLog("❌ 执行出错", error);

    // BOSS安全检测随时可能触发，每一次检测都会耗时，改为报错后检测是否此原因导致的
    let validateButton = await marketPage
      .waitForSelector(
        '#wrap > div > div.error-content > div > button[ka="validate_button_click"]'
      )
      .catch((e) => {
        myLog(`${timeout / 1000}s 内未获取到验证问题按钮`);
      });
    if (validateButton) {
      myLog("检测到 Boss 安全校验。请先在 boss 网页上完成验证后重试");
    }
  }

  // await browser?.close()?.catch((e) => myLog("关闭无头浏览器出错", e));

  browser = null;
  marketPage = null;
}

async function main(pageNum = 1) {
  myLog(
    `页码：${pageNum}；剩余目标：${targetNum}；自定义薪资范围：${
      salaryRange[1] === Infinity ? "不限。" : ""
    }[${salaryRange.join(", ")}]`
  );

  myLog('initBrowserAndSetCookie')
  if (!browser) await initBrowserAndSetCookie();

  // 打开新页面或通过页码组件进行翻页
  myLog('打开新页面或通过页码组件进行翻页');
  if (!onetimeStatus.initMarketPage) {
    let marketUrl = getNewMarketUrl(pageNum); // 出现验证页，说明 puppeteer 被检测了(403)
    myLog('marketPage.goto marketUrl');
    await marketPage.goto(marketUrl, {
      waitUntil: "networkidle2", // 与 waitForTimeout 冲突，貌似只能存在一个
      // timeout: 60000,
    });

    myLog('onetimeCheck');
    await onetimeCheck();
    onetimeStatus.initMarketPage = true;
    myLog("打开岗位页面成功");
  } else {
    myLog("通过页码组件翻页");
    // 点击页码；偶尔出现 BOSS 等待（网页久久不动，会触发资源更新）；最多显示 10 页（一页 30 个岗位）
    await marketPage.waitForSelector(".options-pages > a");
    let pageNumList = Array.from(
      await marketPage.$$(".options-pages > a")
    ).slice(1, -1); // 页码开头、结尾是导航箭头，不需要
    let numList = await Promise.all(
      pageNumList.map(async (node) => {
        let txt = await marketPage.evaluate((node) => node.innerText, node);
        return Number(txt) || "...";
      })
    );
    let foundIndex = numList.findIndex((num) => num === pageNum);
    if (foundIndex === -1) {
      if (pageNum <= 10) {
        throw new Error(`页码不匹配，当前页码：${numList.join(",")}`);
      } else {
        throw new Error(`BOSS 最多返回10页查询结果`);
      }
    }
    await marketPage.evaluate((node) => node.click(), pageNumList[foundIndex]);
  }

  myLog("await autoSayHello()");
  await autoSayHello(marketPage);

  if (targetNum > 0) {
    queryParams.page = pageNum + 1;
    await main(queryParams.page);
  }
}
/** 启动浏览器，写入 cookie */
async function initBrowserAndSetCookie() {
  const BROWERLESS = process.env.BROWERLESS;
  if (BROWERLESS) {
    myLog(
      `使用远程浏览器启动服务，“观察打招呼过程”无效，超时时间建议 16s 以上`
    );

    browser = await puppeteer.connect({
      browserWSEndpoint: BROWERLESS,
    });
    openNewTabTime = 5000;
  } else {
    const executablePath = process.env.CHROME_PATH;
    if (!executablePath) {
      throw new Error('CHROME_PATH environment variable is not set');
    }
    console.log("Executable path:", executablePath);

    browser = await puppeteer.launch({
      headless, // 是否以浏览器视图调试
      devtools: false,
      defaultViewport: null, // null 则页面和窗口大小一致
      executablePath: executablePath,
    });
  }

  marketPage = await getNewPage();

  await marketPage.setDefaultTimeout(timeout);
  await marketPage.setCookie(...cookies);
}
// 检查是否登录、关闭安全问题
async function onetimeCheck() {
  if (!onetimeStatus.checkLogin) {
    const headerLoginBtn = await marketPage
      .waitForSelector(".header-login-btn")
      .catch((e) => {
        onetimeStatus.checkLogin = true;
        myLog("登录态有效");
      });
    if (headerLoginBtn) {
      throw new Error("登录态过期，请重新获取 cookie");
    }
  }
  if (!onetimeStatus.checkSafeQues) {
    // 关闭安全问题弹窗
    await marketPage
      .click(
        ".dialog-account-safe > div.dialog-container > div.dialog-title > a"
      )
      .catch((e) => {
        myLog("未检测到安全问题弹窗");
        onetimeStatus.checkSafeQues = true;
      });
  }
}

async function autoSayHello(marketPage) {
  myLog('await marketPage.waitForSelector')
  await marketPage.waitForSelector("li.job-card-wrapper").catch((e) => {
    throw new Error(`${timeout / 1000}s 内未获取岗位列表`);
  });
  let jobCards = Array.from(await marketPage.$$("li.job-card-wrapper"));
  if (!jobCards?.length) {
    throw new Error("岗位列表为空");
  }
  myLog("await asyncFilter()", jobCards);
  let notPostJobs = await asyncFilter(jobCards, async (node, index) => {
    let companyName = (
      await node.$eval(".company-name", (node) => node.innerText)
    ).toLowerCase();
    let jobName = (
      await node.$eval(".job-name", (node) => node.innerText)
    ).toLowerCase();
    let fullName = `《${companyName}》 ${jobName}`;
    // 选择未沟通的岗位
    let notCommunicate =
      (await node.$eval("a.start-chat-btn", (node) => node.innerText)) !==
      "继续沟通";
    if (!notCommunicate) {
      myLog(`🎃 略过 ${fullName}：曾沟通`);
      return false;
    }

    // 筛选公司名
    let excludeCompanyName = excludeCompanies.find((name) =>
      companyName.includes(name)
    );
    if (excludeCompanyName) {
      myLog(`🎃 略过 ${fullName}，包含屏蔽公司关键词（${excludeCompanyName}）`);
      return false;
    }

    // 筛选岗位名
    let excludeJobName = excludeJobs.find((name) => jobName.includes(name));
    if (excludeJobName) {
      myLog(`🎃 略过 ${fullName}，包含屏蔽工作关键词（${excludeJobName}）`);
      return false;
    }

    // 筛选在线的BOSS
    let isOnline = await node
      .$eval(".boss-online-tag", (node) => node.innerText === "在线")
      .catch(() => false);
    if (!isOnline) {
      myLog(`🎃 略过 ${fullName}，BOSS不在线`);
      return false;
    }

    // 是否过滤猎头
    let isHeadhunter = await node
      .$eval("img.job-tag-icon", (node) => node.alt === "猎头")
      .catch(() => false);
    if (isHeadhunter) {
      myLog(`🎃 略过 ${fullName}，猎头发布`);
      return false;
    }

    // 筛选薪资
    let [oriSalaryMin, oriSalaryMax] = handleSalary(
      await node.$eval(".salary", (node) => node.innerText)
    );
    let [customSalaryMin, customSalaryMax] = salaryRange;
    let availSalary =
      customSalaryMax === Infinity
        ? true // [0, Infinity]，所有工作薪资都比 0 高
        : customSalaryMax >= oriSalaryMin && customSalaryMin <= oriSalaryMax;
    if (!availSalary) {
      myLog(
        `🎃 略过 ${fullName}，当前 [${oriSalaryMin}, ${oriSalaryMax}], 不满足 [${customSalaryMin}, ${customSalaryMax}]`
      );
      return false;
    }

    Object.assign(node, {
      data: {
        oriSalaryMin,
        oriSalaryMax,
        jobName,
        companyName,
      },
    });
    return true;
  });
  myLog("初筛岗位数量：", notPostJobs?.length);

  while (notPostJobs.length && targetNum > 0) {
    let node = notPostJobs.shift();
    await sendHello(node, marketPage);
  }
}
// sendHello 跳转到岗位详情页。至少有 3s 等待
async function sendHello(node, marketPage) {
  await marketPage.evaluate((node) => node.click(), node); // 点击节点，打开公司详情页
  await sleep(openNewTabTime); // 等待新页面加载。远程浏览器需要更多时间，此处连接或新开页面，时间都会变动。

  // 一般只会有一个详情页。打开一页，执行一个任务，然后关闭页面
  const [detailPage] = (await browser.pages()).filter((page) =>
    page.url().startsWith("https://www.zhipin.com/job_detail")
  );
  detailPage?.setDefaultTimeout?.(timeout);
  const detailPageUrl = detailPage?.url?.();

  let {
    oriSalaryMin = 0,
    oriSalaryMax = 0,
    companyName = "",
    jobName = "",
  } = node.data;
  const fullName = `《${companyName}》 ${jobName}`;

  let communityBtn = await detailPage
    .waitForSelector(".btn.btn-startchat")
    .catch((e) => {
      myLog(`${timeout / 1000}s 内未获取到详情页沟通按钮`);
      throw new Error(e);
    });
  let communityBtnInnerText = await detailPage.evaluate(
    (communityBtn) => communityBtn.innerText,
    communityBtn
  );
  // todo 沟通列表偶尔会缺少待打开的岗位，目前仅 window 出现。等待 add.json 接口。岗位详情页点击打开的链接不对，没有携带 id 等参数
  // console.log(
  //     '🔎 ~ sendHello ~ communityBtnInnerText data-url:',
  //     !(await detailPage.evaluate(communityBtn => communityBtn.getAttribute('data-url'), communityBtn)) && true
  // );

  if (communityBtnInnerText.includes("继续沟通")) {
    myLog(`🎃 略过 ${fullName}，曾沟通`);
    return await detailPage.close();
  }

  let jobDetail = (
    await detailPage.$eval(".job-sec-text", (node) => node.innerText)
  )?.toLowerCase();
  let foundExcludeSkill = excludeJobs.find((word) => jobDetail.includes(word));
  if (foundExcludeSkill) {
    myLog(
      `🎃 略过 ${fullName}，工作内容包含屏蔽词：${foundExcludeSkill}。\n🛜 复查链接：${detailPageUrl}`
    );
    return await detailPage.close();
  }
  let notFoundSkill = keySkills.find((skill) => !jobDetail.includes(skill));
  if (keySkills.length && notFoundSkill) {
    myLog(
      `🎃 略过 ${fullName}，工作内容不包含关键技能：${notFoundSkill}。\n🛜 复查链接：${detailPageUrl}`
    );
    return await detailPage.close();
  }

  await sleep(5000); // todo 沟通列表偶尔会缺少待打开的岗位，仅 window 出现。

  await communityBtn.click(); // 点击后，(1)出现小窗 （2）详情页被替换为沟通列表页。

  await sleep(5000);

  let needCompleteResumeSelector = "div.dialog-wrap.greet-pop";
  let ignoreButttonSelector =
    "div.dialog-wrap.greet-pop > div.dialog-container > div.dialog-footer > div > span.btn.btn-outline.btn-cancel";

  // 简历完善弹窗
  const completeResumeBtn = await detailPage.$(needCompleteResumeSelector);
  myLog("出现完善简历的弹框, 直接跳过", completeResumeBtn);
  // 未完善简历,先点击需要点击任性继续按钮
  if (completeResumeBtn) {
    await detailPage.click(ignoreButttonSelector);
  }

  let availableTextarea;
  if (!textareaSelector) {
    availableTextarea = await initTextareaSelector(detailPage, true);
  } else {
    availableTextarea = await detailPage
      .waitForSelector(textareaSelector)
      .catch((e) => {
        throw new Error(
          `尝试投递 ${fullName}。使用 ${textareaSelector}，${
            timeout / 1000
          }s 内未获取输入框`
        ); // todo
      });
    if (!availableTextarea)
      throw new Error("没有可用的输入框，点击“启动任务”重试");
  }
  await availableTextarea.type(helloTxt);
  // 2. 点击发送按钮
  await detailPage.click('div.send-message').catch(e => e); // 弹窗按钮
  await detailPage.click('div.message-controls > div > div.chat-op > button').catch(e => e); // 跳转列表按钮
  await sleep(5000); // 等待消息发送
  targetNum--;

  // 已投递的公司名
  myLog(`✅ ${fullName} [${oriSalaryMin}-${oriSalaryMax}K]`);

  return await detailPage.close();
}

async function getNewPage() {
  const page = await browser.newPage();
  return page;
}

function getNewMarketUrl(pageNum) {
  myLog('getNewMarketUrl')
  if (pageNum) queryParams.page = pageNum;
  return `https://www.zhipin.com/web/geek/job?${Object.keys(queryParams)
    .map((key) => `${key}=${encodeURIComponent(queryParams[key])}`)
    .join("&")}`;
}

// 获取输入框选择器，需经过 setDefaultTimeout 耗时（自定义为 3s）
async function initTextareaSelector(page, returnNode = false) {
  let originModalTextareaSelector = "div.edit-area > textarea";
  let jumpListTextareaSelector =
    "div.chat-conversation > div.message-controls > div > div.chat-input";

  // 小窗输入
  const originModalTextarea = await page
    .waitForSelector(originModalTextareaSelector)
    .catch((e) => {
      myLog(`${timeout / 1000}s 内未获取到小窗输入框`);
    });
  // 沟通列表输入
  const jumpListTextarea = await page
    .waitForSelector(jumpListTextareaSelector)
    .catch((e) => {
      myLog(`${timeout / 1000}s 内未获取到沟通列表输入框`);
    });

  const selector =
    (originModalTextarea && originModalTextareaSelector) ||
    (jumpListTextarea && jumpListTextareaSelector);
  if (selector) textareaSelector = selector;

  if (returnNode) return originModalTextarea || jumpListTextarea;
}

async function asyncFilter(list = [], fn) {
  myLog('asyncFilter inner')
  const results = await Promise.all(list.map(fn)); // 建设成功返回 true，失败返回 false
  return list.filter((_v, index) => results[index]);
}

function myLog(...args) {
  ignoreNum++;
  logs.push(`${args.join(" ")}`);
  console.log(...args);
}

// 处理 '18-35K·14薪' -> [18, 35]
function handleSalary(str) {
  let reg = /\d+/g;
  let [minStr, maxStr] = str.match(reg);
  return [+minStr, +maxStr];
}
function resetOnetimeStatus() {
  Object.keys(onetimeStatus).forEach((key) => {
    onetimeStatus[key] = false;
  });
  ignoreNum = 0;
}
function sleep(time = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
}

function getCurrDate() {
  let stamp = new Date();
  let year = stamp.getFullYear();
  let month = ("0" + (stamp.getMonth() + 1)).slice(-2);
  let date = ("0" + stamp.getDate()).slice(-2);
  let hours = ("0" + stamp.getHours()).slice(-2);
  let mins = ("0" + stamp.getMinutes()).slice(-2);
  let seconds = ("0" + stamp.getSeconds()).slice(-2);
  return `${year}年${month}月${date}日 ${hours}时${mins}分${seconds}秒`;
}
function isError(res) {
  if (res.stack && res.message) {
    return true;
  }
  return false;
}
function promiseQueue(list) {
  let result = [];
  return list
    .reduce((accu, curr) => {
      return accu.then(curr).then((data) => {
        result.push(data);
        return result;
      });
    }, Promise.resolve())
    .catch((err) => `promiseQueue err: ${err}`);
}
function daysBetween(start = Data.now(), end = Date.now()) {
  const msPerDay = 24 * 60 * 60 * 1000; // 每天的毫秒数
  return Math.round((end - start) / msPerDay);
}

module.exports = { main: start, logs };
