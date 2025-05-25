import { parentPort, workerData } from 'worker_threads';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { renderStudentReceiptHTML } from './templates/student-receipt.template';
import { renderTeacherSalaryHTML } from './templates/teacher-salary.template';
import * as sharp from 'sharp';

// Cache for browser instance
let browserInstance: puppeteer.Browser | null = null;
let lastBrowserInit = 0;
const BROWSER_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function getBrowser() {
  const now = Date.now();
  
  // Recreate browser if it's been too long or if it's null
  if (!browserInstance || (now - lastBrowserInit) > BROWSER_REFRESH_INTERVAL) {
    if (browserInstance) {
      try {
        await browserInstance.close();
      } catch (err) {
        console.error('Error closing browser:', err);
      }
    }
    
    browserInstance = await puppeteer.launch({ 
      protocolTimeout: 300000, // 5 minutes
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // Run in single process mode
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--safebrowsing-disable-auto-update',
        '--js-flags="--max-old-space-size=512"' // Limit memory usage
      ]
    });
    lastBrowserInit = now;
  }
  return browserInstance;
}

async function processItem(item: any, type: string, month: number, year: number, dirName: string, qrBase64: string | null) {
  let page: puppeteer.Page | null = null;
  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      let outputDir = '';
      let fileName = '';
      let html = '';
      
      if (type === 'student') {
        const classDir = item.classroom ? item.classroom.trim() : 'Unknown';
        outputDir = path.join(process.cwd(), dirName, classDir);
        fileName = `${(item.name || String(item.student_id)).trim()}.png`;
        html = renderStudentReceiptHTML(item, month, year);
      } else {
        const gvDirName = `GV_T${month}_${year}`;
        outputDir = path.join(process.cwd(), dirName, gvDirName);
        fileName = `${(item.name || String(item.teacher_no)).trim()}.png`;
        html = renderTeacherSalaryHTML(item);
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = path.join(outputDir, fileName);
      const browser = await getBrowser();
      
      // Add delay between operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      page = await browser.newPage();
      
      // Set request interception
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'script', 'document'].includes(resourceType)) {
          req.continue();
        } else {
          req.abort();
        }
      });

      // Set viewport size to A4 dimensions at 150 DPI
      await page.setViewport({
        width: 1240,  // A4 width at 150 DPI
        height: 1754, // A4 height at 150 DPI
        deviceScaleFactor: 2 // tăng độ nét
      });

      await page.setContent(html, { 
        waitUntil: 'networkidle0', 
        timeout: 300000 
      });

      // Add QR code for student
      if (type === 'student' && qrBase64) {
        await page.evaluate((src) => {
          const img = document.getElementById('qr-img');
          if (img) img.setAttribute('src', src);
        }, qrBase64);
      }

      // Add delay before screenshot
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Chụp theo bounding box của receipt-root
      const receiptElement = await page.$('#receipt-root');
      let screenshot: Buffer | undefined;
      if (receiptElement) {
        const boundingBox = await receiptElement.boundingBox();
        if (boundingBox) {
          const shot = await page.screenshot({
            type: 'png',
            clip: boundingBox,
            omitBackground: false
          });
          screenshot = Buffer.isBuffer(shot) ? shot : Buffer.from(shot as Uint8Array);
        } else {
          // fallback nếu không lấy được bounding box
          const shot = await page.screenshot({
            type: 'png',
            fullPage: true,
            omitBackground: false
          });
          screenshot = Buffer.isBuffer(shot) ? shot : Buffer.from(shot as Uint8Array);
        }
      } else {
        // fallback nếu không tìm thấy element
        const shot = await page.screenshot({
          type: 'png',
          fullPage: true,
          omitBackground: false
        });
        screenshot = Buffer.isBuffer(shot) ? shot : Buffer.from(shot as Uint8Array);
      }

      if (!screenshot) throw new Error('Failed to capture screenshot');

      // Optimize the PNG using sharp
      await sharp(screenshot)
        .png({
          compressionLevel: 9,
          quality: 100,
          palette: false,
          effort: 10
        })
        .toFile(outputPath);

      return outputPath;
    } catch (err) {
      retries++;
      console.error(`Attempt ${retries} failed for ${item.name}:`, err);
      
      if (retries > maxRetries) {
        throw err;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      
      // Try to recreate browser if needed
      if (browserInstance) {
        try {
          await browserInstance.close();
        } catch {}
        browserInstance = null;
      }
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {}
      }
    }
  }
}

async function exportWorker() {
  const { type, items, month, year, dirName } = workerData;
  const results: string[] = [];

  // Pre-load QR code if needed
  let qrBase64: string | null = null;
  if (type === 'student') {
    const qrPath = path.join(process.cwd(), 'public', 'qr.png');
    if (fs.existsSync(qrPath)) {
      const qrData = fs.readFileSync(qrPath);
      qrBase64 = `data:image/png;base64,${qrData.toString('base64')}`;
    }
  }

  // Process items sequentially to avoid overwhelming the system
  for (const item of items) {
    try {
      const result = await processItem(item, type, month, year, dirName, qrBase64);
      if (result) {
        results.push(result);
      }
    } catch (err) {
      console.error(`Failed to process ${item.name}:`, err);
    }
  }

  // Clean up browser instance
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (err) {
      console.error('Error closing browser:', err);
    }
    browserInstance = null;
  }

  if (parentPort) parentPort.postMessage(results);
}

exportWorker().catch(console.error); 