const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { partNumber } = req.body;
  if (!partNumber) {
    return res.status(400).json({ error: 'Part number is required' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new", // Required for Vercel
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Prevents permission errors
    });

    const page = await browser.newPage();
    await page.goto('https://www.auto-doc.be/');

    await page.waitForSelector('input[name="keyword"]');
    await page.type('input[name="keyword"]', partNumber);
    await page.keyboard.press('Enter');

    // Wait for cookies popup and reject it (if present)
    try {
      await page.waitForSelector('.notification-popup__reject', { timeout: 5000 });
      await page.click('.notification-popup__reject');
    } catch (error) {
      console.log('No cookie popup detected.');
    }

    await page.waitForSelector('.listing-item__name', { timeout: 10000 });
    await page.click('.listing-item__name');

    await page.waitForSelector('.product-description');
    await page.waitForSelector('.product-info-block__item');

    // Click each collapsible info block
    const items = await page.$$('.product-info-block__item');
    for (const item of items) {
      const link = await item.$('.product-info-block__item-title');
      if (link) {
        await link.click();
        await page.waitForTimeout(3000);
      }
    }

    console.log('Waiting for product-info-block__item-list__item...');
    await page.waitForSelector('.product-info-block__item-list__item', { timeout: 15000 });

    // Extract the engine details
    const engineDetails = await page.$$eval('.product-info-block__item-list__item', (items) => {
      return items.map(item => {
        const modelTitle = item.querySelector('.product-info-block__item-list__title')?.textContent.trim() || 'Unknown Model';
        const engineSpecs = [...item.querySelectorAll('.product-info-block__item-sublist li')].map(li => li.textContent.trim());
        return { model: modelTitle, engineSpecs };
      });
    });

    await browser.close();

    res.json({ models: engineDetails.map(e => e.model) });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
};
