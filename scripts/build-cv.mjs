// Renders cv/cv.html to public/Jose-David-Barrera-CV.pdf (the public CV, without ID or phone details).
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve('cv/cv.html')).href);
await page.pdf({
  path: 'public/Jose-David-Barrera-CV.pdf',
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();
console.log('Wrote public/Jose-David-Barrera-CV.pdf');
