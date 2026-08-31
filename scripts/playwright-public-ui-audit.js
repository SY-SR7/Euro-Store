async page => {
  const baseUrl = 'http://127.0.0.1:3000';

  async function firstValue(path, selector) {
    const response = await page.request.get(`${baseUrl}${path}`);
    if (!response.ok()) return null;
    const payload = await response.json().catch(() => null);
    const rows = payload?.data ?? payload?.products ?? payload?.categories ?? [];
    const row = Array.isArray(rows) ? rows[0] : null;
    return row?.[selector] ?? null;
  }

  const productSlug = await firstValue('/api/products?per_page=1', 'slug');
  const categorySlug = await firstValue('/api/categories', 'slug');
  const collectionResponse = await page.request.get(`${baseUrl}/api/collections/homepage`).catch(() => null);
  const collectionPayload = collectionResponse?.ok() ? await collectionResponse.json().catch(() => null) : null;
  const collectionSlug = collectionPayload?.collection?.slug ?? null;

  const routes = [
    ['home', '/'],
    ['products', '/products'],
    ...(productSlug ? [['product-detail', `/products/${productSlug}`]] : []),
    ['categories', '/categories'],
    ...(categorySlug ? [['category-detail', `/categories/${categorySlug}`]] : []),
    ['offers', '/offers'],
    ['new-arrivals', '/new-arrivals'],
    ...(collectionSlug ? [['collection-detail', `/collections/${collectionSlug}`]] : []),
    ['cart', '/cart'],
    ['checkout', '/checkout'],
    ['checkout-success', '/checkout/success?orderNumber=TEST'],
    ['orders', '/orders'],
    ['order-detail-invalid', '/orders/TEST'],
    ['wishlist', '/wishlist'],
    ['shared-wishlist-invalid', '/wishlist/not-a-real-token'],
    ['loyalty', '/loyalty'],
    ['notifications', '/notifications'],
    ['exchanges', '/exchange'],
    ['exchange-new', '/exchange/new'],
    ['exchange-detail-invalid', '/exchange/not-a-real-id'],
    ['account', '/account'],
    ['account-profile', '/account/profile'],
    ['account-addresses', '/account/addresses'],
    ['faq', '/faq'],
    ['contact', '/contact'],
    ['privacy', '/privacy'],
    ['terms', '/terms'],
    ['auth-login', '/auth/login'],
    ['auth-register', '/auth/register'],
    ['auth-forgot-password', '/auth/forgot-password'],
    ['auth-reset-password', '/auth/reset-password'],
    ['auth-verify-email', '/auth/verify-email'],
    ['not-found', '/this-route-must-not-exist'],
  ];

  const configs = [
    { locale: 'ar', width: 360, height: 800 },
    { locale: 'ar', width: 390, height: 844 },
    { locale: 'ar', width: 412, height: 915 },
    { locale: 'en', width: 360, height: 800 },
    { locale: 'en', width: 390, height: 844 },
    { locale: 'en', width: 412, height: 915 },
  ];

  const report = [];
  for (const config of configs) {
    await page.context().addCookies([
      { name: 'NEXT_LOCALE', value: config.locale, url: baseUrl },
      { name: 'EUROSTORE_LOCALE', value: config.locale, url: baseUrl },
    ]);
    await page.setViewportSize({ width: config.width, height: config.height });

    for (const [name, route] of routes) {
      const consoleErrors = [];
      const pageErrors = [];
      const consoleListener = message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      };
      const errorListener = error => pageErrors.push(error.message);
      page.on('console', consoleListener);
      page.on('pageerror', errorListener);

      let status = null;
      let navigationError = null;
      try {
        const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        status = response?.status() ?? null;
        await page.waitForTimeout(450);
      } catch (error) {
        navigationError = String(error);
      }

      const state = await page.evaluate(() => {
        const controls = Array.from(document.querySelectorAll('button,a,input,select,textarea'));
        const iconOnlyMissingLabel = controls.filter(element => {
          if (!(element instanceof HTMLElement)) return false;
          const text = (element.innerText || '').trim();
          const label = element.getAttribute('aria-label') || element.getAttribute('title');
          const imageAlt = element.querySelector('img[alt]')?.getAttribute('alt');
          return text.length === 0 && !label && !imageAlt;
        }).length;
        const inputsMissingLabel = Array.from(document.querySelectorAll('input,select,textarea')).filter(element => {
          const id = element.getAttribute('id');
          return !element.getAttribute('aria-label') && !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
        }).length;
        const touchTargetsUnder44 = controls.filter(element => {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          return rect.width < 44 || rect.height < 44;
        }).length;
        return {
          title: document.title,
          lang: document.documentElement.lang,
          direction: document.documentElement.dir || document.body.dir,
          h1: Array.from(document.querySelectorAll('h1')).map(element => element.textContent?.trim()).filter(Boolean),
          controls: controls.length,
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length,
          inputs: document.querySelectorAll('input,select,textarea').length,
          brokenImages: Array.from(document.images).filter(image => image.complete && image.naturalWidth === 0).map(image => image.currentSrc || image.src),
          emptyLinks: Array.from(document.querySelectorAll('a')).filter(link => !link.getAttribute('href') || link.getAttribute('href') === '#').length,
          rawTranslation: /\b(nav|common|auth|profile|catalog|product)\.[A-Za-z]/.test(document.body.innerText),
          overflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
          iconOnlyMissingLabel,
          inputsMissingLabel,
          touchTargetsUnder44,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          visibleTextLength: document.body.innerText.trim().length,
        };
      }).catch(error => ({ evaluationError: String(error) }));

      const screenshotPath = `output/playwright/web/${config.locale}-${config.width}x${config.height}-${name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined);
      page.off('console', consoleListener);
      page.off('pageerror', errorListener);
      report.push({
        locale: config.locale,
        viewport: `${config.width}x${config.height}`,
        name,
        route,
        status,
        finalUrl: page.url(),
        navigationError,
        consoleErrors,
        pageErrors,
        state,
        screenshotPath,
      });
    }
  }
  const issues = report.filter(item =>
    item.navigationError ||
    item.pageErrors.length ||
    item.consoleErrors.length ||
    Number(item.status ?? 0) >= 500 ||
    item.state?.brokenImages?.length ||
    item.state?.overflowPx ||
    item.state?.rawTranslation ||
    item.state?.iconOnlyMissingLabel ||
    item.state?.inputsMissingLabel
  );
  const redirects = report
    .filter(item => item.finalUrl !== `${baseUrl}${item.route}`)
    .map(item => ({ locale: item.locale, viewport: item.viewport, name: item.name, route: item.route, status: item.status, finalUrl: item.finalUrl }));
  const representativeMetrics = report
    .filter(item => item.locale === 'ar' && item.viewport === '390x844')
    .map(item => ({ name: item.name, route: item.route, status: item.status, finalUrl: item.finalUrl, state: item.state }));
  return {
    productSlug,
    categorySlug,
    collectionSlug,
    routes: routes.length,
    checks: report.length,
    issueCount: issues.length,
    issues,
    redirects,
    representativeMetrics,
  };
}
