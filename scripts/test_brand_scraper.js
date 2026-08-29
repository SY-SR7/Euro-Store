async function testExactScrape(brand, query) {
  const url = 'https://www.amazon.de/s?k=' + encodeURIComponent(query);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    }
  });
  const html = await res.text();
  const containerRegex = /<div[^>]*data-asin="([A-Z0-9]{10})"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let match;
  const brandKeywords = brand.toLowerCase().split(/[\s-]+/);

  while ((match = containerRegex.exec(html)) !== null) {
    const asin = match[1];
    const chunk = match[2];
    const isSponsored = chunk.includes('s-sponsored-label') || chunk.includes('Gesponserte Anzeige');
    const imgMatch = chunk.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    const titleMatch = chunk.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) || chunk.match(/alt="([^"]+)"/);

    if (imgMatch && titleMatch && !isSponsored) {
      const title = titleMatch[1].trim();
      const titleLower = title.toLowerCase();
      const matchesBrand = brandKeywords.some(kw => kw.length > 2 && titleLower.includes(kw));

      if (matchesBrand) {
        console.log(`✅ [${brand}] Found: "${title}"`);
        console.log(`   ASIN: ${asin}`);
        console.log(`   Image: ${imgMatch[1].replace(/\._AC_[^.]+\./, '._AC_SL1500_.')}`);
        return { asin, title, image: imgMatch[1].replace(/\._AC_[^.]+\./, '._AC_SL1500_.') };
      }
    }
  }
  console.log(`❌ No exact brand match found for "${brand}" with query "${query}"`);
  return null;
}

async function run() {
  await testExactScrape('Chanel', 'chanel bleu de chanel');
  await testExactScrape('Dior', 'dior sauvage eau de parfum');
  await testExactScrape('Polo Ralph Lauren', 'ralph lauren polo');
  await testExactScrape('Vans', 'vans old skool');
  await testExactScrape('Ray-Ban', 'ray ban aviator rb3025');
  await testExactScrape('Casio G-Shock', 'casio g shock ga 2100');
  await testExactScrape('Gucci', 'gucci guilty');
  await testExactScrape('Prada', 'prada luna rossa');
}
run();
