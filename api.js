const express = require('express');
import chromium  from '@sparticuz/chromium';
import playwright from 'playwright-core';

const app = express();
const port = process.env.PORT || 3000;

async function takeScreenshot(url) {
  const browser = await playwright.chromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  
  const page = await browser.newPage();
  await page.goto(url);
  const screenshotBuffer = await page.screenshot();
  await browser.close();
  return screenshotBuffer;
}
async function checkProfile(username) {
  const browser = await playwright.chromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const context = await browser.newContext({
    viewport: {
      width: 812,
      height: 512
    }

  });
  const page = await context.newPage();

  const sites = [{
      site: "Twitter",
      endpoint: "https://twitter.com/{username}",
      found: 'div[data-testid="primaryColumn"]',
      wait: 'div[data-testid="primaryColumn"]',
      method: "scrapper",
      selectors: {
        name: {
          selector: 'div[data-testid="UserDescription"] > div > span',
          type: "text",
        },
        username: {
          selector: 'a[href="/' + username + '"] > div',
          type: "text",
        },
        avatar: {
          selector: 'img[src*="/profile_images/"]',
          type: "src",
        },
        bio: {
          selector: 'div[data-testid="UserDescription"] > div > div > span',
          type: "text",
        },
      }
    },

    {
      site: "Duolingo",
      endpoint: "https://www.duolingo.com/profile/{username}",
      found: 'h1[data-test="profile-username"]',
      wait: 'body',
      method: "scrapper",
      selectors: {
        name: {
          selector: 'h1[data-test="profile-username"] > span',
          type: "text",
        },
        username: {
          selector: 'h1[data-test="profile-username"] > div',
          type: "text",
        },
        avatar: {
          selector: "div._2StlV > div > img",
          type: "src",
        },
      }
    },



  ];

  const profiles = [];

  for (const site of sites) {
    try {


      let url = site.endpoint.replace("{username}", username)
      await page.goto(url, {
        timeout: 60000
      });

      if (site.wait) {
        await page.waitForSelector(site.wait)
      }
      const html = await page.content()


      const $ = await cheerio.load(html)
      const exists = $(site.found);

      if (!exists.contents().length > 0) {
        console.log("not found ", site.site);
        continue;
      }

      profiles[site.site] = {
        site: site.site
      };

      Object.keys(site.selectors).map(key => {
        const info = $(site.selectors[key].selector);
        profiles[site.site][key] = site.selectors[key].type === "text" ? info.text().trim() : info.attr("src");

      })


    } catch (error) {
      console.log(error);
      profiles[site.site] = {
        error: true
      }
    }
  }

  await browser.close();

  return profiles;

}

app.get('/check', async (req, res) => {
  const username =  req.query?.user || "gabriela";

  if (!url) {
    return res.status(400).json({ error: 'URL not provided' });
  }

  try {
checkProfile(username)
  .then(profiles => {
    res.status(200).json(profiles)
  })
    
  } catch (error) {
    console.error('Error taking screenshot:', error);
    res.status(500).json({ error });
  }
});

app.get('/api', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL not provided' });
  }

  try {
    const screenshotBuffer = await takeScreenshot(url.toString());
    res.set('Content-Type', 'image/png');
    res.send(screenshotBuffer);
  } catch (error) {
    console.error('Error taking screenshot:', error);
    res.status(500).json({ error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
