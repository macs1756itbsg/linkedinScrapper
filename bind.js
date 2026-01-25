import fs from "fs"
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";


const readUsers = () => {
  return JSON.parse(fs.readFileSync('./users/index.json', 'utf8'))
}

function getRandomNumber() {
  const min = 10_000;
  const max = 60_000;
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


const core = async (user, dir) => {

  const bingQuery = encodeURIComponent(`${user.first_name} ${user.last_name} ${user.company_name}`);

  const url = `https://www.bing.com/search?q=${bingQuery}&form=QBLH&sp=-1&ghc=1&lq=0&pq=${user.first_name}+${user.last_name}+${user.company_name}&sc=6-27&qs=n&sk=&cvid=F94470FC8398407C8E4DD512197FE616`;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      userDataDir: "/Users/user/Library/Application Support/Google/Chrome/Default",
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",

        // 🌍 Мова браузера
        "--lang=uk-UA,uk,en-US,en",

        // 🌍 Таймзона (Україна)
        "--timezone=Europe/Kyiv",

      ],
    });

    const page = await browser.newPage();

    // 🧠 Firefox-like User-Agent (важливо!)
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0"
    );

    // 📍 Геолокація Львів
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://www.bing.com", ["geolocation"]);

    await page.setGeolocation({
      latitude: 49.8397,
      longitude: 24.0297,
      accuracy: 20,
    });

    // 🧩 Контекст як у реального Firefox
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      Object.defineProperty(navigator, "languages", {
        get: () => ["uk-UA", "uk", "en-US", "en"],
      });

      Object.defineProperty(navigator, "platform", {
        get: () => "MacIntel",
      });

      const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
      Intl.DateTimeFormat.prototype.resolvedOptions = function () {
        const options = originalResolvedOptions.call(this);
        options.timeZone = "Europe/Kyiv";
        return options;
      };
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector("a");


    const decodedLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map(a => a.getAttribute("href"))
        .filter(href => href) // залишаємо тільки існуючі href
        .map(href => {
          try {
            // спробуємо декодувати
            return decodeURIComponent(href);
          } catch {
            // якщо не вийшло, повертаємо оригінал
            return href;
          }
        });
    });


    const realLinks = decodedLinks
      .map(href => {
        try {
          // перевіряємо чи є параметр u= в href
          const urlMatch = href.match(/[?&]u=([^&]+)/);
          if (urlMatch) {
            // decodeURIComponent + base64 decode, якщо потрібно
            let decoded = decodeURIComponent(urlMatch[1]);

            // Bing іноді додає a1 перед base64 – прибираємо якщо є
            if (decoded.startsWith("a1")) decoded = decoded.slice(2);

            return decodeURIComponent(atob(decoded)); // якщо base64
          }
        } catch (e) {
          return null;
        }
        return null;
      })
      .filter(Boolean);

    const scrappedLinkedin = realLinks?.filter(e => e.includes('linkedin.com') && e.includes('/in/'))[0] ?? undefined;

    console.log("ping", scrappedLinkedin);


    // const linkedinLinks = await page.evaluate(() => {
    //   return Array.from(document.querySelectorAll("a"))
    //     .map(a => a.getAttribute("href"))
    //     .filter(href => href && href.includes("linkedin.com"))
    //     .map(href => {
    //       // Google redirect fix: /url?q=REAL_URL
    //       if (href.startsWith("/url?q=")) {
    //         return decodeURIComponent(
    //           href.replace("/url?q=", "").split("&")[0]
    //         );
    //       }
    //       return href;
    //     })
    //     .filter(href => href.includes("linkedin.com"));
    // });

    await browser.close();
    // fs.rmSync(dir, { recursive: true, force: true });

    addToScrapped(user.id)
    return scrappedLinkedin;

  } catch (error) {
    console.log(error)
  }
};




const users = readUsers()
const scrapped = readScrapped()

let count = 0

for (const user of users) {

  if (scrapped.includes(user.id)) {
    console.log('Already scrapped');
    continue
  }

  const linkedinAccount = await core(user, './profile',)

  addNewUserWithLinkedin([{ linkedinAccount: linkedinAccount, ...user }])

  console.log('count', count);
  await new Promise(resolve => setTimeout(() => { resolve('') }, getRandomNumber()))
  count += 1

}



console.log(users);

