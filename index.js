import fs from "fs"
import puppeteer from "puppeteer";

const readUsers = () => {
  return JSON.parse(fs.readFileSync('./users/index.json', 'utf8'))
}

function getRandomNumber() {
  const min = 10000;
  const max = 60000;
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




const core = async (user) => {
  const searchRequest = `${user.first_name} ${user.last_name} ${user.company_name}`;
  const query = encodeURIComponent(searchRequest);

  const url = `https://www.google.com/search?q=${query}`;

  const browser = await puppeteer.launch({
    headless: "new", // важливо
    userDataDir: "./profile",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  );

  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Чекаємо результати пошуку
  await page.waitForSelector("a");

  const hasCaptcha = await page.$("#captcha-form");

  if (hasCaptcha) {
    console.error("❌ CAPTCHA detected. Stopping script.");

    await browser.close();
    process.exit(1); // 🔥 повна зупинка
  }



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

  await browser.close();
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

  const linkedinAccount = await core(user)

  addNewUserWithLinkedin([{ linkedinAccount, ...user }])

  console.log('count', count);
  addToScrapped(user.id)
  await new Promise(resolve => setTimeout(() => { resolve('') }, getRandomNumber()))
  count += 1

}



console.log(users);

