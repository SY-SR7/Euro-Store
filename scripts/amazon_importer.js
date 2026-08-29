const path = require('path');
const fs = require('fs');
const { createClient } = require(path.join(__dirname, '../apps/web/node_modules/@supabase/supabase-js'));
require(path.join(__dirname, '../apps/web/node_modules/dotenv')).config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Top Amazon Search Queries for all 24 Famous Brands
const BRAND_SEARCH_QUERIES = [
  // Adidas
  {
    brand: 'Adidas',
    categorySlug: 'shoes',
    queries: [
      'adidas samba og',
      'adidas gazelle sneaker',
      'adidas stan smith',
      'adidas superstar schuhe',
      'adidas ultraboost light',
      'adidas originals t-shirt',
      'adidas tiro trainingshose'
    ]
  },
  // Nike
  {
    brand: 'Nike',
    categorySlug: 'shoes',
    queries: [
      'nike air force 1 07',
      'nike air max 90',
      'nike air max 270',
      'nike dunk low retro',
      'nike tech fleece hoodie',
      'nike club fleece sweatshirt',
      'nike revolution 6 running'
    ]
  },
  // Puma
  {
    brand: 'Puma',
    categorySlug: 'shoes',
    queries: [
      'puma smash v2 sneaker',
      'puma suede classic xxi',
      'puma caven sneaker',
      'puma rbd game low',
      'puma essential logo hoodie',
      'puma liga trainingshose'
    ]
  },
  // Lacoste
  {
    brand: 'Lacoste',
    categorySlug: 'men',
    queries: [
      'lacoste classic polo l1212',
      'lacoste carnabys sneaker',
      'lacoste lerond sneaker',
      'lacoste cap tagesmutze',
      'lacoste hoodie sweat'
    ]
  },
  // Tommy Hilfiger
  {
    brand: 'Tommy Hilfiger',
    categorySlug: 'men',
    queries: [
      'tommy hilfiger t-shirt round neck',
      'tommy hilfiger core stretch slim polo',
      'tommy hilfiger corporate sneaker',
      'tommy hilfiger leather belt',
      'tommy hilfiger hoodie sweat'
    ]
  },
  // Calvin Klein
  {
    brand: 'Calvin Klein',
    categorySlug: 'men',
    queries: [
      'calvin klein cotton stretch boxer briefs',
      'calvin klein monogram logo t-shirt',
      'calvin klein leather wallet passcase',
      'calvin klein hoodie essentials',
      'calvin klein runner sneaker'
    ]
  },
  // New Balance
  {
    brand: 'New Balance',
    categorySlug: 'shoes',
    queries: [
      'new balance 574 core sneaker',
      'new balance 550 low basketball',
      'new balance 327 retro lifestyle',
      'new balance 990v6 heritage',
      'new balance essentials hoodie'
    ]
  },
  // Skechers
  {
    brand: 'Skechers',
    categorySlug: 'shoes',
    queries: [
      'skechers d lites memory foam',
      'skechers uno stand on air',
      'skechers arch fit sneaker',
      'skechers flex appeal sneaker'
    ]
  },
  // Reebok
  {
    brand: 'Reebok',
    categorySlug: 'shoes',
    queries: [
      'reebok club c 85 vintage',
      'reebok classic leather sneaker',
      'reebok nano x3 cross training',
      'reebok workout plus'
    ]
  },
  // Converse
  {
    brand: 'Converse',
    categorySlug: 'shoes',
    queries: [
      'converse chuck taylor all star classic',
      'converse chuck 70 high top',
      'converse run star hike platform',
      'converse one star pro'
    ]
  },
  // Vans
  {
    brand: 'Vans',
    categorySlug: 'shoes',
    queries: [
      'vans old skool core classic',
      'vans authentic sneaker',
      'vans sk8-hi high top',
      'vans classic slip-on checkerboard'
    ]
  },
  // Polo Ralph Lauren
  {
    brand: 'Polo Ralph Lauren',
    categorySlug: 'men',
    queries: [
      'polo ralph lauren custom slim fit mesh polo',
      'polo ralph lauren embroidered pony t-shirt',
      'polo ralph lauren cotton cable knit sweater',
      'polo ralph lauren classic baseball cap'
    ]
  },
  // Hugo Boss
  {
    brand: 'Hugo Boss',
    categorySlug: 'men',
    queries: [
      'boss polo shirt regular fit',
      'boss t-shirt crew neck logo',
      'boss saturn low top sneaker',
      'boss leather belt reversible'
    ]
  },
  // Emporio Armani
  {
    brand: 'Emporio Armani',
    categorySlug: 'men',
    queries: [
      'emporio armani ea7 train core polo',
      'emporio armani eagle logo t-shirt',
      'emporio armani leather wallet',
      'ea7 visibility low top sneaker'
    ]
  },
  // Zara
  {
    brand: 'Zara',
    categorySlug: 'women',
    queries: [
      'zara structured blazer jacket',
      'zara satin effect midi dress',
      'zara oversized poplin shirt',
      'zara wide leg high waist trousers'
    ]
  },
  // Ray-Ban
  {
    brand: 'Ray-Ban',
    categorySlug: 'accessories',
    queries: [
      'ray ban aviator classic rb3025',
      'ray ban wayfarer classic rb2140',
      'ray ban round metal rb3447',
      'ray ban clubmaster classic rb3016'
    ]
  },
  // Casio G-Shock
  {
    brand: 'Casio G-Shock',
    categorySlug: 'accessories',
    queries: [
      'casio g shock ga 2100 1a1er',
      'casio g shock dw 5600bb 1er',
      'casio g shock mudmaster gg b100',
      'casio vintage digital watch a168wa'
    ]
  },
  // Gucci
  {
    brand: 'Gucci',
    categorySlug: 'luxury',
    queries: [
      'gucci marmont matelasse shoulder bag',
      'gucci ace embroidered sneaker',
      'gucci ophidia gg supreme pouch',
      'gucci guilty pour homme eau de parfum'
    ]
  },
  // Chanel
  {
    brand: 'Chanel',
    categorySlug: 'luxury',
    queries: [
      'chanel bleu de chanel parfum',
      'chanel coco mademoiselle eau de parfum',
      'chanel chance eau tendre',
      'chanel no 5 eau de parfum'
    ]
  },
  // Dior
  {
    brand: 'Dior',
    categorySlug: 'luxury',
    queries: [
      'dior sauvage eau de parfum',
      'dior miss dior blooming bouquet',
      'dior b23 high top oblique sneaker',
      'dior saddle pouch leather'
    ]
  },
  // Prada
  {
    brand: 'Prada',
    categorySlug: 'luxury',
    queries: [
      'prada paradoxe eau de parfum',
      'prada luna rossa ocean eau de parfum',
      'prada re nylon shoulder bag',
      'prada monolith brushed leather derby'
    ]
  },
  // Versace
  {
    brand: 'Versace',
    categorySlug: 'luxury',
    queries: [
      'versace eros flame eau de parfum',
      'versace dylan blue pour homme',
      'versace medusa biggie sunglasses',
      'versace trigreca sneaker'
    ]
  },
  // Michael Kors
  {
    brand: 'Michael Kors',
    categorySlug: 'women',
    queries: [
      'michael kors jet set travel tote',
      'michael kors jet set crossbody bag',
      'michael kors bradshaw chronograph watch',
      'michael kors leather continental wallet'
    ]
  },
  // Under Armour
  {
    brand: 'Under Armour',
    categorySlug: 'men',
    queries: [
      'under armour tech 2.0 short sleeve t-shirt',
      'under armour charged assert 9 running shoes',
      'under armour rival fleece hoodie',
      'under armour blitzing 3.0 cap'
    ]
  }
];

async function fetchAmazonSearchResult(query) {
  const url = `https://www.amazon.de/s?k=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      }
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract product containers
    const items = [];
    const containerRegex = /<div[^>]*data-asin="([A-Z0-9]{10})"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    let match;

    while ((match = containerRegex.exec(html)) !== null) {
      const asin = match[1];
      const chunk = match[2];
      if (asin && asin.length === 10) {
        // extract image
        const imgMatch = chunk.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
        // extract title
        const titleMatch = chunk.match(/<h2[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) ||
                           chunk.match(/alt="([^"]+)"/);

        // extract price
        const priceMatch = chunk.match(/<span class="a-price-whole">([0-9.,]+)<\/span>/);

        if (imgMatch && titleMatch) {
          let highResImg = imgMatch[1].replace(/\._AC_[^.]+\./, '._AC_SL1500_.');
          let rawTitle = titleMatch[1].trim().replace(/&amp;/g, '&').replace(/&quot;/g, '"');
          let priceEur = priceMatch ? parseFloat(priceMatch[1].replace('.', '').replace(',', '.')) : 89.99;

          if (rawTitle && rawTitle.length > 5 && !items.some(x => x.asin === asin)) {
            items.push({
              asin,
              title: rawTitle,
              image: highResImg,
              priceEur: isNaN(priceEur) ? 89.99 : priceEur
            });
          }
        }
      }
    }
    return items;
  } catch (err) {
    console.error(`Error querying Amazon for "${query}":`, err.message);
    return null;
  }
}

module.exports = {
  BRAND_SEARCH_QUERIES,
  fetchAmazonSearchResult,
  supabase
};
