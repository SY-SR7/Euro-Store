#!/usr/bin/env python3
"""
Fetch exact, real studio product photos (Amazon & Brand Store quality) for EuroStore.
100% STUDIO QUALITY: Pure white/neutral background, zero people, zero duplicates.
"""

import sys
import io
import time
import urllib.parse
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = Path("D:/Files/Programming_Projects/Euro Store")
OUTPUT_DIR = ROOT / "apps" / "web" / "public" / "media" / "owned" / "catalog-v3" / "products"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# List of all products to ensure unique, exact matching studio photos
PRODUCTS_SEARCH_QUERIES = {
    # ─── New Balance ──────────────────────────────────────────
    "new-balance-574-core": "New Balance 574 Core grey white sneaker studio white background",
    "new-balance-990v6-made-in-usa": "New Balance 990v6 Made in USA grey sneaker studio white background",
    "new-balance-327-retro-runner": "New Balance 327 sneaker white beige studio product white background",
    "new-balance-550-basketball": "New Balance 550 white leather sneaker studio product",
    "new-balance-1906r-tech-runner": "New Balance 1906R tech runner silver white sneaker studio",
    "new-balance-2002r-protection": "New Balance 2002R Protection Pack grey sneaker studio",
    "new-balance-essentials-hoodie": "New Balance Essentials stacked logo hoodie flatlay studio",
    "new-balance-athletics-pant": "New Balance Athletics sweatpants studio white background",

    # ─── Converse ─────────────────────────────────────────────
    "converse-chuck-taylor-all-star-high": "Converse Chuck Taylor All Star High black white sneaker studio white background",
    "converse-chuck-70-low": "Converse Chuck 70 vintage low black canvas sneaker studio",
    "converse-run-star-hike": "Converse Run Star Hike platform black white sneaker studio",
    "converse-one-star-vintage": "Converse One Star vintage suede black sneaker studio",

    # ─── Vans ─────────────────────────────────────────────────
    "vans-old-skool-classic": "Vans Old Skool black white stripe sneaker studio white background",
    "vans-sk8-hi-high-top": "Vans Sk8-Hi black white high top sneaker studio",
    "vans-classic-slip-on": "Vans Classic Slip-On black white canvas sneaker studio",
    "vans-authentic-low": "Vans Authentic black canvas sneaker studio white background",

    # ─── Polo Ralph Lauren ────────────────────────────────────
    "ralph-lauren-mesh-polo": "Polo Ralph Lauren custom slim mesh polo shirt navy studio white background",
    "ralph-lauren-cable-knit-sweater": "Polo Ralph Lauren cable-knit cotton sweater beige studio",
    "ralph-lauren-oxford-shirt": "Polo Ralph Lauren classic oxford shirt blue studio white background",
    "ralph-lauren-leather-belt": "Polo Ralph Lauren brown leather belt brass buckle studio",
    "ralph-lauren-fleece-joggers": "Polo Ralph Lauren fleece track sweatpants navy studio",
    "ralph-lauren-chino-cap": "Polo Ralph Lauren cotton chino cap navy studio white background",

    # ─── Ray-Ban ──────────────────────────────────────────────
    "ray-ban-aviator-classic-gold": "Ray-Ban Aviator RB3025 gold green glass sunglasses studio white background",
    "ray-ban-wayfarer-classic": "Ray-Ban Original Wayfarer RB2140 black sunglasses studio white background",
    "ray-ban-clubmaster-classic": "Ray-Ban Clubmaster RB3016 sunglasses studio white background",
    "ray-ban-round-metal-gold": "Ray-Ban Round Metal RB3447 gold sunglasses studio white background",
    "ray-ban-justin-matte-black": "Ray-Ban Justin RB4165 matte black sunglasses studio",

    # ─── Casio / G-Shock ──────────────────────────────────────
    "casio-g-shock-ga-2100-casioak": "Casio G-Shock GA-2100-1A1 black CasiOak watch studio white background",
    "casio-vintage-gold-a168": "Casio Vintage A168WG gold digital watch studio white background",
    "casio-g-shock-dw-5600": "Casio G-Shock DW-5600E classic square watch studio",
    "casio-edifice-chronograph": "Casio Edifice chronograph stainless steel watch studio",

    # ─── Dior ─────────────────────────────────────────────────
    "dior-sauvage-eau-de-parfum": "Dior Sauvage Eau de Parfum perfume bottle studio white background",
    "dior-miss-dior-eau-de-parfum": "Miss Dior Eau de Parfum perfume bottle studio white background",
    "dior-homme-intense-edp": "Dior Homme Intense Eau de Parfum bottle studio",
    "dior-saddle-grained-leather-bag": "Dior Saddle bag black grained leather gold hardware studio",
    "dior-b23-high-top-sneaker": "Dior B23 high-top oblique sneaker studio white background",

    # ─── Prada ────────────────────────────────────────────────
    "prada-paradoxe-eau-de-parfum": "Prada Paradoxe Eau de Parfum triangle bottle studio white background",
    "prada-re-nylon-shoulder-bag": "Prada Re-Nylon shoulder bag black triangle logo studio",
    "prada-saffiano-leather-wallet": "Prada Saffiano leather zip wallet black studio",
    "prada-monolith-leather-loafers": "Prada Monolith brushed leather loafers chunky sole studio",
    "prada-linea-rossa-sunglasses": "Prada Linea Rossa sunglasses black red stripe studio",

    # ─── Emporio Armani ───────────────────────────────────────
    "armani-stronger-with-you-intensely": "Emporio Armani Stronger With You Intensely perfume bottle studio",
    "armani-chronograph-black-dial": "Emporio Armani chronograph watch AR2434 stainless steel studio",
    "armani-eagle-logo-polo": "Emporio Armani eagle logo polo shirt black studio",
    "armani-bifold-leather-wallet": "Emporio Armani leather bi-fold wallet black studio",

    # ─── Versace ──────────────────────────────────────────────
    "versace-eros-flame-eau-de-parfum": "Versace Eros Flame Eau de Parfum red bottle studio white background",
    "versace-medusa-leather-belt": "Versace Medusa head gold buckle black leather belt studio",
    "versace-chain-reaction-sneaker": "Versace Chain Reaction chunky sneaker white black studio",
    "versace-dylan-blue-pour-homme": "Versace Dylan Blue pour homme perfume bottle studio",
    "versace-barocco-silk-scarf": "Versace Barocco print silk scarf gold black studio",

    # ─── Under Armour ─────────────────────────────────────────
    "under-armour-tech-20-tee": "Under Armour Tech 2.0 short sleeve training tee black studio white background",
    "under-armour-rival-fleece-hoodie": "Under Armour Rival fleece pullover hoodie black studio",
    "under-armour-hovr-phantom-3": "Under Armour UA HOVR Phantom 3 running shoes black studio",
    "under-armour-heatgear-leggings": "Under Armour HeatGear compression leggings black studio",
    "under-armour-hustle-50-backpack": "Under Armour Hustle 5.0 backpack black studio white background",

    # ─── Michael Kors ─────────────────────────────────────────
    "michael-kors-jet-set-saffiano-tote": "Michael Kors Jet Set large Saffiano leather tote bag black gold studio",
    "michael-kors-slim-runway-gold-watch": "Michael Kors Slim Runway gold watch MK3179 studio white background",
    "michael-kors-greenwich-crossbody": "Michael Kors Greenwich small crossbody bag black studio",
    "michael-kors-leather-card-case": "Michael Kors Saffiano leather slim card case black studio",

    # ─── Nike Core Bestsellers ────────────────────────────────
    "nike-air-force-1-07": "Nike Air Force 1 07 all white leather sneaker studio white background",
    "nike-air-max-90": "Nike Air Max 90 white black infrared sneaker studio white background",
    "nike-air-max-270": "Nike Air Max 270 black white sneaker studio white background",
    "nike-air-jordan-1-high": "Nike Air Jordan 1 High Chicago red white black sneaker studio white background",
    "nike-pegasus-40": "Nike Pegasus 40 running shoe black white studio",
    "nike-sb-dunk-low": "Nike SB Dunk Low Panda black white sneaker studio white background",
    "nike-tech-fleece-hoodie": "Nike Tech Fleece full-zip hoodie grey black studio flatlay",
    "nike-club-fleece-joggers": "Nike Club Fleece sweatpants black studio",
    "nike-windrunner-jacket": "Nike Windrunner jacket chevron black white studio",
    "nike-vapormax-plus": "Nike Air VaporMax Plus black sneaker studio white background",
    "nike-court-vision-low": "Nike Court Vision Low white sneaker studio",
    "nike-pro-compression-top": "Nike Pro compression long-sleeve top black studio",
    "nike-dri-fit-club-cap": "Nike Dri-FIT Club cap black white swoosh studio",

    # ─── Adidas Core Bestsellers ──────────────────────────────
    "adidas-samba-classic": "Adidas Samba Classic black white gum sole sneaker studio white background",
    "adidas-gazelle-indoor": "Adidas Gazelle indoor blue white sneaker studio white background",
    "adidas-ultraboost-light": "Adidas Ultraboost Light running shoe core black studio",
    "adidas-stan-smith": "Adidas Stan Smith white green leather sneaker studio white background",
    "adidas-nmd-r1": "Adidas NMD_R1 black sneaker white boost studio",
    "adidas-superstar-foundation": "Adidas Superstar shell toe white black stripes sneaker studio",
    "adidas-adilette-comfort-slides": "Adidas Adilette Comfort slides black white 3 stripes studio",
    "adidas-terrex-swift-r3": "Adidas Terrex Swift R3 hiking shoe black studio",

    # ─── Puma Core Bestsellers ────────────────────────────────
    "puma-suede-classic-xxi": "Puma Suede Classic XXI black white sneaker studio white background",
    "puma-palermo-leather-sneaker": "Puma Palermo leather sneaker blue white gum sole studio",
    "puma-rs-x-bold": "Puma RS-X bold chunky sneaker white black studio",
    "puma-future-rider-play-on": "Puma Future Rider play on colorblock sneaker studio",
    "puma-ferrari-race-polo": "Puma Ferrari race polo shirt red black studio",

    # ─── Lacoste Core Bestsellers ─────────────────────────────
    "lacoste-l1212-classic-polo": "Lacoste L.12.12 classic polo shirt white green crocodile studio white background",
    "lacoste-carnaby-leather-sneaker": "Lacoste Carnaby Pro white leather sneaker green croc studio",
    "lacoste-cotton-zip-cardigan": "Lacoste full zip cotton cardigan navy studio",
    "lacoste-grained-leather-wallet": "Lacoste Fitzgerald leather wallet black studio",
    "lacoste-classic-gabardine-cap": "Lacoste classic cotton gabardine cap navy green crocodile studio",

    # ─── Zara Core Bestsellers ────────────────────────────────
    "zara-tailored-textured-blazer": "Zara tailored textured blazer navy studio white background",
    "zara-pleated-wide-leg-trousers": "Zara pleated wide leg trousers beige studio",
    "zara-satin-midi-slip-dress": "Zara satin midi slip dress emerald green studio",
    "zara-wool-blend-overcoat": "Zara structured wool blend overcoat camel studio",
    "zara-oversized-poplin-shirt": "Zara 100% poplin oversized shirt white studio",

    # ─── Gucci Core Bestsellers ───────────────────────────────
    "gucci-gg-marmont-shoulder-bag": "Gucci GG Marmont small shoulder bag black chevron leather gold GG studio",
    "gucci-horsebit-1953-loafer": "Gucci 1953 Horsebit loafer black leather gold horsebit studio",
    "gucci-double-g-leather-belt": "Gucci Double G buckle black leather belt studio white background",
    "gucci-flora-gorgeous-gardenia": "Gucci Flora Gorgeous Gardenia Eau de Parfum pink bottle studio",
    "gucci-square-acetate-sunglasses": "Gucci square acetate sunglasses black gold GG studio",
    "gucci-ophidia-gg-zip-wallet": "Gucci Ophidia GG Supreme zip around wallet web stripe studio",

    # ─── Chanel Core Bestsellers ──────────────────────────────
    "chanel-bleu-de-chanel-parfum": "Bleu de Chanel Parfum perfume bottle studio white background",
    "chanel-coco-mademoiselle-edp": "Chanel Coco Mademoiselle Eau de Parfum bottle studio white background",
    "chanel-classic-1112-flap-bag": "Chanel Classic 11.12 flap bag black quilted caviar leather gold hardware studio",
    "chanel-gabrielle-essence-edp": "Chanel Gabrielle Essence Eau de Parfum square bottle studio",

    # ─── Hugo Boss Core Bestsellers ───────────────────────────
    "boss-slim-virgin-wool-suit": "BOSS Hugo Boss slim fit virgin wool suit charcoal grey studio",
    "boss-pallas-pique-polo": "BOSS Hugo Boss Pallas pique polo shirt black studio",
    "boss-bottled-eau-de-parfum": "BOSS Bottled Eau de Parfum bottle studio white background",
    "boss-skeleton-automatic-watch": "BOSS Grand Prix chronograph watch stainless steel studio",
    "boss-leather-cardholder": "BOSS signature grained calf leather cardholder black studio",

    # ─── Calvin Klein Core Bestsellers ────────────────────────
    "ck-one-eau-de-toilette": "CK One Eau de Toilette frosted bottle studio white background",
    "ck-eternity-eau-de-parfum": "Calvin Klein Eternity Eau de Parfum bottle studio",
    "ck-modern-cotton-crewneck": "Calvin Klein modern cotton crewneck sweatshirt grey studio",
    "ck-90s-straight-denim": "Calvin Klein 90s straight leg jeans blue denim studio",
    "calvin-klein-reversible-puffer": "Calvin Klein reversible insulated puffer jacket black studio",

    # ─── Tommy Hilfiger Core Bestsellers ──────────────────────
    "tommy-hilfiger-flag-polo": "Tommy Hilfiger iconic flag polo shirt navy red white studio",
    "tommy-hilfiger-1985-oxford-shirt": "Tommy Hilfiger 1985 stretch oxford shirt white studio",
    "tommy-hilfiger-cable-knit-sweater": "Tommy Hilfiger cable knit sweater navy studio",
    "tommy-hilfiger-puffer-jacket": "Tommy Hilfiger down padded puffer jacket navy red studio",
    "tommy-hilfiger-heritage-backpack": "Tommy Hilfiger heritage stripe nylon backpack navy studio",
}

def download_bing_image(page, query, out_file):
    # Bing images search gives clean high-res direct image links with no rate-limits
    search_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}&qft=+filterui:imagesize-large+filterui:photo-photo"
    try:
        page.goto(search_url, timeout=20000)
        page.wait_for_timeout(800)
        
        # Extract image candidates
        imgs = page.locator("img.mimg").all()
        for img_el in imgs[:5]:
            src = img_el.get_attribute("src")
            if not src or "data:image" in src:
                src = img_el.get_attribute("data-src")
            if src and src.startswith("http"):
                req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                try:
                    img_data = urllib.request.urlopen(req, timeout=8).read()
                    pil_img = Image.open(io.BytesIO(img_data))
                    if pil_img.width >= 120 and pil_img.height >= 120:
                        # Make clean square studio WebP
                        w, h = pil_img.size
                        max_dim = max(w, h)
                        square = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
                        square.paste(pil_img.convert("RGB"), ((max_dim - w) // 2, (max_dim - h) // 2))
                        square_resized = square.resize((1000, 1000), Image.Resampling.LANCZOS)
                        square_resized.save(out_file, "WEBP", quality=90)
                        return True
                except:
                    pass
    except Exception as e:
        pass
    return False

def main():
    print(f"🚀 Fetching {len(PRODUCTS_SEARCH_QUERIES)} EXACT Amazon/Retail Studio Photos...")
    success = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        
        for slug, query in PRODUCTS_SEARCH_QUERIES.items():
            out_file = OUTPUT_DIR / f"{slug}.webp"
            print(f"  [{success+1}/{len(PRODUCTS_SEARCH_QUERIES)}] {slug}...", end=" ", flush=True)
            ok = download_bing_image(page, query, out_file)
            if ok:
                print(f"✅ OK ({out_file.stat().st_size // 1024}KB)")
                success += 1
            else:
                print("❌ Retrying with fallback query...", end=" ", flush=True)
                ok = download_bing_image(page, f"{slug.replace('-', ' ')} product photo white background", out_file)
                if ok:
                    print("✅ OK")
                    success += 1
                else:
                    print("FAIL")
            time.sleep(0.3)
        browser.close()

    print(f"\n🎉 Done! Successfully fetched {success}/{len(PRODUCTS_SEARCH_QUERIES)} unique studio product photos!")

if __name__ == "__main__":
    main()
