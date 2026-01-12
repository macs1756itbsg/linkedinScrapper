import fs from "fs"
import puppeteer from "puppeteer";
import crypto from "crypto";
//import { solve } from "recaptcha-solver";


function randomViewport() {
  const widths = [1280, 1366, 1440, 1536, 1600, 1680, 1920];
  const heights = [720, 768, 800, 900, 1024, 1080];

  const width = widths[Math.floor(Math.random() * widths.length)];
  const height = heights[Math.floor(Math.random() * heights.length)];

  return { width, height };
}


//  https://proxyscrape.com
const proxies = [
  "216.26.251.61:3129",
  "154.213.165.79:3129",
  "216.26.227.198:3129",
  "65.111.5.26:3129",
  "104.207.34.98:3129",
  "216.26.243.89:3129",
  "216.26.225.113:3129",
  "209.50.181.202:3129",
  "45.3.37.25:3129",
  "209.50.169.3:3129",
  "104.207.45.1:3129",
  "216.26.228.79:3129",
  "209.50.179.178:3129",
  "216.26.244.68:3129",
  "216.26.252.162:3129",
  "209.50.188.134:3129",
  "45.3.48.57:3129",
  "209.50.169.84:3129",
  "209.50.164.182:3129",
  "209.50.163.107:3129",
  "104.207.46.161:3129",
  "65.111.15.198:3129",
  "104.207.54.209:3129",
  "216.26.248.10:3129",
  "216.26.225.171:3129",
  "209.50.169.187:3129",
  "104.207.43.210:3129",
  "65.111.6.54:3129",
  "216.26.254.125:3129",
  "209.50.187.102:3129",
  "45.3.43.112:3129",
  "45.3.35.9:3129",
  "209.50.169.33:3129",
  "104.207.39.45:3129",
  "209.50.179.220:3129",
  "216.26.231.87:3129",
  "65.111.27.247:3129",
  "216.26.253.43:3129",
  "216.26.230.161:3129",
  "209.50.170.179:3129",
  "104.207.54.204:3129",
  "65.111.6.33:3129",
  "104.207.33.66:3129",
  "216.26.249.56:3129",
  "216.26.230.139:3129",
  "65.111.21.183:3129",
  "154.213.163.191:3129",
  "65.111.4.246:3129",
  "45.3.48.32:3129",
  "216.26.235.69:3129",
  "216.26.238.4:3129",
  "45.3.49.248:3129",
  "104.207.45.180:3129",
  "216.26.226.152:3129",
  "65.111.0.33:3129",
  "209.50.180.200:3129",
  "154.213.162.150:3129",
  "65.111.21.14:3129",
  "65.111.5.218:3129",
  "45.3.39.183:3129",
  "45.3.51.25:3129",
  "209.50.191.178:3129",
  "216.26.252.200:3129",
  "216.26.254.75:3129",
  "216.26.243.213:3129",
  "65.111.7.102:3129",
  "65.111.27.224:3129",
  "216.26.248.96:3129",
  "45.3.46.74:3129",
  "104.207.52.141:3129",
  "65.111.22.127:3129",
  "216.26.255.204:3129",
  "65.111.20.122:3129",
  "65.111.0.145:3129",
  "216.26.244.38:3129",
  "65.111.22.3:3129",
  "65.111.1.0:3129",
  "216.26.228.11:3129",
  "216.26.243.29:3129",
  "209.50.183.197:3129",
  "216.26.255.245:3129",
  "104.207.58.75:3129",
  "209.50.176.226:3129",
  "45.3.35.39:3129",
  "65.111.20.234:3129",
  "104.207.45.221:3129",
  "65.111.22.37:3129",
  "65.111.4.27:3129",
  "45.3.42.55:3129",
  "216.26.238.32:3129",
  "209.50.160.176:3129",
  "65.111.0.58:3129",
  "65.111.26.15:3129",
  "104.207.45.55:3129",
  "209.50.180.203:3129",
  "209.50.179.155:3129",
  "104.207.63.52:3129",
  "104.207.55.131:3129",
  "45.3.46.41:3129",
  "104.207.63.180:3129"
];

const proxy = proxies[Math.floor(Math.random() * proxies.length)];

const readUsers = () => {
  return JSON.parse(fs.readFileSync('./users/index.json', 'utf8'))
}

function getRandomNumber() {
  const min = 100_000;
  const max = 600_000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const readScrapped = () => {
  if (!fs.existsSync("./scrapped/index.json")) return [];
  return JSON.parse(fs.readFileSync('./scrapped/index.json', 'utf8'));
};

const addToScrapped = (id) => {
  const existing = readScrapped();
  fs.writeFileSync('./scrapped/index.json', JSON.stringify([...existing, id], null, 2));
};


const readUsersWithLinkedins = () => {
  return JSON.parse(fs.readFileSync('./users/linkedin.json', 'utf8'))
}

const addNewUserWithLinkedin = (newUsers) => {
  const existing = readUsersWithLinkedins();

  const map = new Map();

  existing.forEach(u => map.set(u.id, u));
  newUsers.forEach(u => map.set(u.id, u));

  const all = Array.from(map.values());

  fs.writeFileSync('./users/linkedin.json', JSON.stringify(all, null, 2));

  console.log(`Saved ${newUsers.length} new users. Total: ${all.length}`);
};



//set client 

// function randomUserAgent() {
//   const chromeVersions = ["119.0.0.0", "120.0.0.0", "121.0.0.0"];
//   const platforms = [
//     "Windows NT 10.0; Win64; x64",
//     "Macintosh; Intel Mac OS X 10_15_7",
//     "X11; Linux x86_64",
//   ];

//   const platform = platforms[Math.floor(Math.random() * platforms.length)];
//   const version = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];

//   return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
// }

// async function setDynamicUserAgent(page) {
//   const client = await page.target().createCDPSession();

//   await client.send("Network.setUserAgentOverride", {
//     userAgent: randomUserAgent(),
//     platform: "Win32",
//   });
// }
// set client 


const core = async (user, dir, w, h) => {
  //const searchRequest = `${user.first_name} ${user.last_name} ${user.company_name}`;
  //const query = encodeURIComponent(searchRequest);

  //const url = `https://www.google.com/search?q=${query}`;

  const bingQuery = encodeURIComponent(
    `site:linkedin.com/in ${user.first_name} ${user.last_name} ${user.company_name}`
  );

  const url = `https://www.bing.com/search?q=${bingQuery}&form=MSNVS`;


  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: dir,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--lang=en-US,en",
      `--window-size=${w},${h}`,
   //   `--proxy-server=http://${proxy}`
    ],
  });

  // puppeteer.use(StealthPlugin());



  //init page

  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  await client.send("Network.setUserAgentOverride", {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/120.0.0.0 Safari/537.36",
    platform: "MacIntel",
  });

  // await page.evaluateOnNewDocument(() => {
  //   // navigator.webdriver
  //   Object.defineProperty(navigator, "webdriver", {
  //     get: () => undefined,
  //   });

  //   // platform
  //   Object.defineProperty(navigator, "platform", {
  //     get: () => "MacIntel",
  //   });

  //   // vendor
  //   Object.defineProperty(navigator, "vendor", {
  //     get: () => "Google Inc.",
  //   });

  //   // languages
  //   Object.defineProperty(navigator, "languages", {
  //     get: () => ["en-US", "en"],
  //   });

  //   // hardware
  //   Object.defineProperty(navigator, "hardwareConcurrency", {
  //     get: () => 8,
  //   });

  //   Object.defineProperty(navigator, "deviceMemory", {
  //     get: () => 8,
  //   });
  // });


  // await page.evaluateOnNewDocument(() => {
  //   Object.defineProperty(navigator, "plugins", {
  //     get: () => [
  //       {
  //         name: "Chrome PDF Viewer",
  //         filename: "internal-pdf-viewer",
  //         description: "Portable Document Format",
  //       },
  //     ],
  //   });
  // });

  await page.setViewport({
    width: w,
    height: h,
    deviceScaleFactor: 2,
  });

  // await page.evaluateOnNewDocument(() => {
  //   const getParameter = WebGLRenderingContext.prototype.getParameter;

  //   WebGLRenderingContext.prototype.getParameter = function (parameter) {
  //     if (parameter === 37445) return "Apple";
  //     if (parameter === 37446) return "Apple M1";
  //     return getParameter.call(this, parameter);
  //   };
  // });

  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  const hasCaptcha = await page.$("#captcha-form");

  if (hasCaptcha) {
    console.error("❌ CAPTCHA detected. Stopping script.");

    await browser.close();
    return
    // fs.rmSync(dir, { recursive: true, force: true });
    // process.exit(1);

  }

  await page.waitForSelector("a");


  const linkedinLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a"))
      .map(a => a.getAttribute("href"))
      .filter(href => href && href.includes("linkedin.com"))
      .map(href => {
        // Google redirect fix: /url?q=REAL_URL
        if (href.startsWith("/url?q=")) {
          return decodeURIComponent(
            href.replace("/url?q=", "").split("&")[0]
          );
        }
        return href;
      })
      .filter(href => href.includes("linkedin.com"));
  });

  //await browser.close();
 // fs.rmSync(dir, { recursive: true, force: true });
  addToScrapped(user.id)
  return linkedinLinks[0];
};




const users = readUsers()
const scrapped = readScrapped()

let count = 0

for (const user of users) {

  if (scrapped.includes(user.id)) {
    console.log('Already scrapped');
    continue
  }
  const { width, height } = randomViewport()
  const dir = `./profiles/${crypto.randomUUID()}`;
  const linkedinAccount = await core(user, dir, width, height)

  addNewUserWithLinkedin([{ linkedinAccount, ...user }])

  console.log('count', count);
  await new Promise(resolve => setTimeout(() => { resolve('') }, getRandomNumber()))
  count += 1

}



console.log(users);

