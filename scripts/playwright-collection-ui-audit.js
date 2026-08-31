async (page) => {
  const baseUrl = "http://127.0.0.1:3000";
  const route = "/collections/quiet-luxury";
  const checks = [];

  for (const locale of ["ar", "en"]) {
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: locale, url: baseUrl },
      { name: "EUROSTORE_LOCALE", value: locale, url: baseUrl },
    ]);

    for (const viewport of [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 412, height: 915 },
    ]) {
      await page.setViewportSize(viewport);
      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForTimeout(450);
      const state = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        direction: document.documentElement.dir || document.body.dir,
        h1: Array.from(document.querySelectorAll("h1"))
          .map((node) => node.textContent?.trim())
          .filter(Boolean),
        overflowPx: Math.max(
          0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
      }));
      const screenshotPath = `output/playwright/web/${locale}-${viewport.width}x${viewport.height}-collection-detail.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      checks.push({
        locale,
        viewport: `${viewport.width}x${viewport.height}`,
        status: response?.status() ?? null,
        finalUrl: page.url(),
        state,
        screenshotPath,
      });
    }
  }

  return checks;
}
