const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true }); // Set headless to false if you want to see the browser
  const page = await browser.newPage();
  await page.goto('https://www.auto-doc.be/'); // Replace with the target URL

  // Wait for the search input to load
  await page.waitForSelector('input[name="keyword"]');

  const partNumber = 'OX153D3'; // Replace with the part number you want to search
  await page.type('input[name="keyword"]', partNumber);

  await page.keyboard.press('Enter');

  // Wait for the cookie popup to appear and close it
  //await page.waitForSelector('.notification-popup__reject');
  //await page.click('.notification-popup__reject'); // Reject cookies
  //await new Promise(resolve => setTimeout(resolve, 5000));

  // Wait for the search results page to load and the first result to appear
  await page.waitForSelector('.listing-item__name'); // Ensure the results are loaded

  await page.click('.listing-item__name');

  // Wait for the part details page to load
  await page.waitForSelector('.product-description');

  // Wait for the product-info-block items to load
  await page.waitForSelector('.product-info-block__item');

  // Loop through the product-info-block__item elements and click the links
  const items = await page.$$('.product-info-block__item');
  for (const item of items) {
    // Find the link within each item to click
    const link = await item.$('.product-info-block__item-title');
    if (link) {
      await link.click(); // Click the link to reveal more content
      await new Promise(resolve => setTimeout(resolve, 5000));

    }
  }

  // Wait for the product-info-block__item-list__item elements to be revealed
  //await page.waitForSelector('.product-info-block__item-list__item');

  // Now we can safely extract the engine details
  const engineDetails = await page.$$eval('.product-info-block__item-list__item', (items) => {
    const engines = [];

    items.forEach(item => {
      const modelTitle = item.querySelector('.product-info-block__item-list__title');
      if (modelTitle) {
        const engineList = item.querySelector('.product-info-block__item-sublist');
        if (engineList) {
          const engineSpecs = Array.from(engineList.querySelectorAll('li')).map(li => li.textContent.trim());
          engines.push({ model: modelTitle.textContent.trim(), engineSpecs });
        }
      }
    });

    return engines;
  });

  // Output the extracted engine data
  console.log(engineDetails);

  // Close the browser
  await browser.close();
})();
