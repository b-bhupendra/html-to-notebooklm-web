import { NextRequest, NextResponse } from 'next/server';
import playwright from 'playwright-core';
import chromium from '@sparticuz/chromium';

// Vercel deployment configuration
const isDev = process.env.NODE_ENV === 'development';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const htmlContent = await file.text();

    console.log('Launching browser...');
    const browser = await playwright.chromium.launch({
      args: isDev ? [] : chromium.args,
      executablePath: isDev 
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // Local path fallback
        : await chromium.executablePath(),
      headless: isDev ? true : chromium.headless,
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 }
    });
    const page = await context.newPage();

    console.log('Loading HTML content...');
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('Expanding layout...');
    await page.evaluate(() => {
      // 1. Helper to find scrollable elements
      const isScrollable = (el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        return (
          (el.scrollHeight > el.clientHeight + 5) && 
          (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'hidden')
        );
      };

      // 2. Identify the main scrollable container
      const all = document.querySelectorAll<HTMLElement>('*');
      let mainScroller: HTMLElement | null = null;
      let maxScrollHeight = 0;

      all.forEach(el => {
        if (isScrollable(el)) {
          if (el.scrollHeight > maxScrollHeight) {
            maxScrollHeight = el.scrollHeight;
            mainScroller = el;
          }
        }
      });

      // 3. Hide UI clutter (headers, buttons, sidebars)
      const selectorsToHide = [
        'header', 'footer', 'nav', 'aside', '.sidebar', '.navigation', 
        'button', '.buttons', '.controls', '[role="button"]', 
        '[role="navigation"]', '.menu', '.mobile-only'
      ];
      selectorsToHide.forEach(sel => {
        document.querySelectorAll<HTMLElement>(sel).forEach(el => {
          if (!mainScroller || !mainScroller.contains(el)) {
            el.style.setProperty('display', 'none', 'important');
          }
        });
      });

      // 4. Force expansion of the main container and its parents
      if (mainScroller) {
        let curr: HTMLElement | null = mainScroller;
        while (curr && curr !== document.documentElement) {
          curr.style.setProperty('height', 'auto', 'important');
          curr.style.setProperty('max-height', 'none', 'important');
          curr.style.setProperty('overflow', 'visible', 'important');
          curr.style.setProperty('overflow-y', 'visible', 'important');
          curr.style.setProperty('display', 'block', 'important');
          curr.style.setProperty('position', 'relative', 'important');
          curr = curr.parentElement;
        }
      }

      // 5. Global cleanup
      const style = document.createElement('style');
      style.textContent = `
        html, body { height: auto !important; overflow: visible !important; position: relative !important; }
        * { max-height: none !important; contain: none !important; }
      `;
      document.head.appendChild(style);
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 0));

    console.log('Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      scale: 0.8,
    });

    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${file.name.replace('.html', '')}_notebooklm.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
