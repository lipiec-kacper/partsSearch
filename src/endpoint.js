//
// const express = require('express');
// const puppeteer = require('puppeteer');
// const cors = require('cors');
// const app = express();
// const port = 3000;
//
// // Enable CORS
// app.use(cors()); // This will allow all origins, you can limit it for more security.
//
// app.use(express.json()); // Parse incoming JSON requests
//
// // Endpoint to fetch models by part number
// app.post('/api/getModels', async (req, res) => {
//   const { partNumber } = req.body;
//
//   if (!partNumber) {
//     return res.status(400).json({ error: 'Part number is required' });
//   }
//
//   try {
//     const browser = await puppeteer.launch({ headless: true }); // Set headless to true to run without opening a browser
//     const page = await browser.newPage();
//     await page.goto('https://www.auto-doc.be/'); // Replace with the target URL
//
//     // Wait for the search input to load
//     await page.waitForSelector('input[name="keyword"]');
//
//     // Use the part number from the request body
//     await page.type('input[name="keyword"]', partNumber);
//     await page.keyboard.press('Enter');
//
//     //await page.waitForSelector('.notification-popup__reject');
//     //await page.click('.notification-popup__reject'); // Reject cookies
//     await new Promise(resolve => setTimeout(resolve, 5000));
//
//
//     // Wait for the search results page to load and the first result to appear
//     await page.waitForSelector('.listing-item__name');
//     await page.click('.listing-item__name');
//
//     // Wait for the part details page to load
//     await page.waitForSelector('.product-description');
//
//     // Wait for the product-info-block items to load
//     await page.waitForSelector('.product-info-block__item');
//
//     // Loop through the product-info-block__item elements and click the links
//     const items = await page.$$('.product-info-block__item');
//     for (const item of items) {
//       // Find the link within each item to click
//       const link = await item.$('.product-info-block__item-title');
//       if (link) {
//         await link.click(); // Click the link to reveal more content
//         await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for content to load
//       }
//     }
//
//     // Wait for the product-info-block__item-list__item elements to be revealed
//     await page.waitForSelector('.product-info-block__item-list__item');
//
//     // Now we can safely extract the engine details
//     const engineDetails = await page.$$eval('.product-info-block__item-list__item', (items) => {
//       const engines = [];
//
//       items.forEach(item => {
//         const modelTitle = item.querySelector('.product-info-block__item-list__title');
//         if (modelTitle) {
//           const engineList = item.querySelector('.product-info-block__item-sublist');
//           if (engineList) {
//             const engineSpecs = Array.from(engineList.querySelectorAll('li')).map(li => li.textContent.trim());
//             engines.push({ model: modelTitle.textContent.trim(), engineSpecs });
//           }
//         }
//       });
//
//       return engines; // Ensure to return the extracted data
//     });
//
//     await browser.close(); // Close the browser after extracting the data
//
//     // Send the extracted engine details as response
//     res.json({ models: engineDetails.map(e => e.model) });
//
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to fetch models' });
//   }
// });
//
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });
//

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

app.use(express.json());

app.post('/api/getModels', async (req, res) => {
  const { partNumber } = req.body;

  if (!partNumber) {
    return res.status(400).json({ error: 'Part number is required' });
  }

  try {
    const browser = await puppeteer.launch({ headless: false }); // Set headless to true to run without opening a browser
    const page = await browser.newPage();
    await page.goto('https://www.auto-doc.be/'); // Replace with the target URL

    await page.waitForSelector('input[name="keyword"]');

    await page.type('input[name="keyword"]', partNumber);
    await page.keyboard.press('Enter');

    await page.waitForSelector('.notification-popup__reject');
    await page.click('.notification-popup__reject'); // Reject cookies
    await new Promise(resolve => setTimeout(resolve, 5000));

    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for content to load

    await page.waitForSelector('.listing-item__name');
    await page.click('.listing-item__name');

    await page.waitForSelector('.product-description');

    await page.waitForSelector('.product-info-block__item');

    const items = await page.$$('.product-info-block__item');
    for (const item of items) {
      const link = await item.$('.product-info-block__item-title');
      if (link) {
        await link.click(); // Click the link to reveal more content
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for content to load
      }
    }

    await page.screenshot({
      path: 'fullpage_screenshot.png',
      fullPage: true // This will capture the entire page, including any content outside the viewport
    });
    console.log('Waiting for product-info-block__item-list__item...');
    await page.waitForSelector('.product-info-block__item-list__item', { timeout: 15000, visible: true });


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

      return engines; // Ensure to return the extracted data
    });

    await browser.close(); // Close the browser after extracting the data

    res.json({ models: engineDetails.map(e => e.model) });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});




