const express = require('express');
import chromium  from '@sparticuz/chromium';
import playwright from 'playwright-core';

const app = express();
const port = process.env.PORT || 3000;

async function takeScreenshot(url) {
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  
  const page = await browser.newPage();
  await page.goto(url);
  const screenshotBuffer = await page.screenshot();
  await browser.close();
  return screenshotBuffer;
}

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
