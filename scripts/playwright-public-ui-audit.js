async page => {
  const routes = ['/', '/products', '/products?category=mens', '/categories', '/products/nordhavn-merino-overshirt', '/contact', '/faq', '/privacy', '/terms', '/cart', '/checkout', '/wishlist', '/account', '/account/profile', '/account/addresses', '/orders', '/loyalty', '/exchange', '/exchange/new'];
  const report = [];
  for (const route of routes) {
    const response = await page.goto('http://localhost:3000' + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => ({
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map(element => element.textContent),
      controls: document.querySelectorAll('button,a,input,select,textarea').length,
      brokenImages: Array.from(document.images).filter(image => image.complete && image.naturalWidth === 0).map(image => image.src),
      emptyLinks: Array.from(document.querySelectorAll('a')).filter(link => !link.getAttribute('href') || link.getAttribute('href') === '#').length,
      rawTranslation: document.body.innerText.includes('nav.') || document.body.innerText.includes('common.') || document.body.innerText.includes('auth.'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    }));
    report.push({ route: route, status: response ? response.status() : null, finalUrl: page.url(), state: state });
  }
  return report;
}
