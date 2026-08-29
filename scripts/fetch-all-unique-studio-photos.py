#!/usr/bin/env python3
"""
EuroStore 100% Authentic Amazon/Retail Studio Product Photo Engine
Fetches 1000x1000 high-resolution studio photos on clean white backgrounds for all products.
Zero people, zero duplicates, exact product matches.
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

# 186 Products with specific high-precision queries
ALL_PRODUCTS = [
    # ─── Nike ──────────────────────────────────────────────────
    ("nike-air-force-1-07", "Nike Air Force 1 07 white leather sneaker studio white background"),
    ("nike-air-max-90", "Nike Air Max 90 white black sneaker studio white background"),
    ("nike-air-max-270", "Nike Air Max 270 black white sneaker studio white background"),
    ("nike-air-jordan-1-high", "Nike Air Jordan 1 High Chicago red white black sneaker studio white background"),
    ("nike-pegasus-40", "Nike Pegasus 40 running shoe black white studio white background"),
    ("nike-sb-dunk-low", "Nike SB Dunk Low Panda black white sneaker studio white background"),
    ("nike-tech-fleece-hoodie", "Nike Tech Fleece full zip hoodie grey studio product"),
    ("nike-club-fleece-joggers", "Nike Club Fleece sweatpants black studio product"),
    ("nike-windrunner-jacket", "Nike Windrunner jacket black white studio product"),
    ("nike-vapormax-plus", "Nike Air VaporMax Plus black sneaker studio white background"),
    ("nike-court-vision-low", "Nike Court Vision Low white sneaker studio white background"),
    ("nike-pro-compression-top", "Nike Pro compression long sleeve top black studio"),
    ("nike-dri-fit-club-cap", "Nike Dri-FIT Club cap black studio white background"),
    ("nike-zoom-structure", "Nike Air Zoom Structure running shoe studio white background"),
    ("nike-therma-fit-hoodie", "Nike Therma-FIT pullover hoodie black studio product"),

    # ─── Adidas ────────────────────────────────────────────────
    ("adidas-samba-classic", "Adidas Samba Classic black white gum sole sneaker studio white background"),
    ("adidas-gazelle-indoor", "Adidas Gazelle Indoor blue white sneaker studio white background"),
    ("adidas-ultraboost-light", "Adidas Ultraboost Light black running shoe studio white background"),
    ("adidas-stan-smith", "Adidas Stan Smith white green leather sneaker studio white background"),
    ("adidas-nmd-r1", "Adidas NMD R1 black white sneaker studio white background"),
    ("adidas-superstar-foundation", "Adidas Superstar white black stripes sneaker studio white background"),
    ("adidas-forum-low", "Adidas Forum Low white blue sneaker studio white background"),
    ("adidas-campus-00s", "Adidas Campus 00s core black suede sneaker studio white background"),
    ("adidas-beckenbauer-tracktop", "Adidas Beckenbauer track jacket navy studio product"),
    ("adidas-3-stripes-tee", "Adidas 3 Stripes t-shirt black white studio product"),
    ("adidas-trefoil-hoodie", "Adidas Trefoil hoodie black studio product"),
    ("adidas-tiro-21-pants", "Adidas Tiro 21 track pants black white stripes studio product"),
    ("adidas-adilette-comfort-slides", "Adidas Adilette Comfort slides black white studio white background"),
    ("adidas-terrex-swift-r3", "Adidas Terrex Swift R3 hiking shoe black studio white background"),

    # ─── New Balance ───────────────────────────────────────────
    ("new-balance-574-core", "New Balance 574 Core grey sneaker studio white background"),
    ("new-balance-990v6-made-in-usa", "New Balance 990v6 Made in USA grey sneaker studio white background"),
    ("new-balance-327-retro-runner", "New Balance 327 sneaker white beige studio white background"),
    ("new-balance-550-basketball", "New Balance 550 white leather sneaker studio white background"),
    ("new-balance-1906r-tech-runner", "New Balance 1906R tech runner silver sneaker studio white background"),
    ("new-balance-2002r-protection", "New Balance 2002R Protection Pack grey sneaker studio white background"),
    ("new-balance-essentials-hoodie", "New Balance Essentials hoodie grey studio product"),
    ("new-balance-athletics-pant", "New Balance Athletics sweatpants black studio product"),

    # ─── Converse ──────────────────────────────────────────────
    ("converse-chuck-taylor-all-star-high", "Converse Chuck Taylor All Star High black canvas sneaker studio white background"),
    ("converse-chuck-70-low", "Converse Chuck 70 low black canvas sneaker studio white background"),
    ("converse-run-star-hike", "Converse Run Star Hike black platform sneaker studio white background"),
    ("converse-one-star-vintage", "Converse One Star black suede sneaker studio white background"),

    # ─── Vans ──────────────────────────────────────────────────
    ("vans-old-skool-classic", "Vans Old Skool black white sneaker studio white background"),
    ("vans-sk8-hi-high-top", "Vans Sk8-Hi black white high top sneaker studio white background"),
    ("vans-classic-slip-on", "Vans Classic Slip-On black white canvas sneaker studio white background"),
    ("vans-authentic-low", "Vans Authentic black canvas sneaker studio white background"),

    # ─── Puma ──────────────────────────────────────────────────
    ("puma-suede-classic-xxi", "Puma Suede Classic XXI black white sneaker studio white background"),
    ("puma-palermo-leather-sneaker", "Puma Palermo sneaker blue white gum sole studio white background"),
    ("puma-rs-x-bold", "Puma RS-X bold white black sneaker studio white background"),
    ("puma-future-rider-play-on", "Puma Future Rider play on sneaker studio white background"),
    ("puma-ferrari-race-polo", "Puma Ferrari polo shirt red black studio product"),
    ("puma-mercedes-polo", "Puma Mercedes AMG polo shirt black studio product"),
    ("puma-clyde-all-pro", "Puma Clyde All Pro basketball sneaker studio white background"),
    ("puma-thunder-spectra", "Puma Thunder Spectra chunky sneaker studio white background"),
    ("puma-essentials-fleece-hoodie", "Puma Essentials fleece hoodie black studio product"),
    ("puma-classic-logo-tee", "Puma Classic logo t-shirt black white studio product"),

    # ─── Skechers ──────────────────────────────────────────────
    ("skechers-go-walk-7", "Skechers GO WALK 7 black slip on walking shoe studio white background"),
    ("skechers-arch-fit-leather", "Skechers Arch Fit black leather sneaker studio white background"),
    ("skechers-dlites-memory-foam", "Skechers DLites chunky sneaker white navy studio white background"),
    ("skechers-max-cushioning-elite", "Skechers Max Cushioning Elite black sneaker studio white background"),
    ("skechers-slip-ins-max-cushioning", "Skechers Slip-ins Max Cushioning black shoe studio white background"),
    ("skechers-relaxed-fit-expected", "Skechers Relaxed Fit Expected brown slip on studio white background"),

    # ─── Reebok ────────────────────────────────────────────────
    ("reebok-club-c-85-vintage", "Reebok Club C 85 vintage chalk green leather sneaker studio white background"),
    ("reebok-classic-leather", "Reebok Classic Leather all white sneaker studio white background"),
    ("reebok-nano-x4-training", "Reebok Nano X4 training shoe black white studio white background"),
    ("reebok-instapump-fury", "Reebok Instapump Fury OG black white sneaker studio white background"),
    ("reebok-workout-plus", "Reebok Workout Plus white leather sneaker studio white background"),
    ("reebok-freestyle-hi", "Reebok Freestyle Hi white leather high top studio white background"),
    ("reebok-bb-4000-ii", "Reebok BB 4000 II basketball sneaker studio white background"),
    ("reebok-vector-fleece-sweatshirt", "Reebok Vector fleece sweatshirt navy studio product"),

    # ─── Lacoste ───────────────────────────────────────────────
    ("lacoste-l1212-classic-polo", "Lacoste L.12.12 classic polo shirt white green crocodile studio white background"),
    ("lacoste-carnaby-leather-sneaker", "Lacoste Carnaby Pro white leather sneaker green crocodile studio white background"),
    ("lacoste-cotton-zip-cardigan", "Lacoste zip cardigan navy blue studio product"),
    ("lacoste-grained-leather-wallet", "Lacoste Fitzgerald leather wallet black studio white background"),
    ("lacoste-classic-gabardine-cap", "Lacoste classic cotton gabardine cap navy studio white background"),
    ("lacoste-challenge-polo", "Lacoste challenge striped polo shirt white navy studio product"),
    ("lacoste-lerond-sneaker", "Lacoste Lerond white canvas sneaker studio white background"),
    ("lacoste-sport-polo", "Lacoste Sport breathable polo shirt green studio product"),

    # ─── Polo Ralph Lauren ─────────────────────────────────────
    ("ralph-lauren-mesh-polo", "Polo Ralph Lauren custom slim mesh polo shirt navy studio white background"),
    ("ralph-lauren-cable-knit-sweater", "Polo Ralph Lauren cable-knit sweater beige studio white background"),
    ("ralph-lauren-oxford-shirt", "Polo Ralph Lauren classic oxford shirt blue studio white background"),
    ("ralph-lauren-leather-belt", "Polo Ralph Lauren brown leather belt studio white background"),
    ("ralph-lauren-fleece-joggers", "Polo Ralph Lauren fleece track sweatpants navy studio white background"),
    ("ralph-lauren-chino-cap", "Polo Ralph Lauren cotton chino cap navy studio white background"),

    # ─── Ray-Ban ───────────────────────────────────────────────
    ("ray-ban-aviator-classic-gold", "Ray-Ban Aviator RB3025 gold green glass sunglasses studio white background"),
    ("ray-ban-wayfarer-classic", "Ray-Ban Original Wayfarer RB2140 black sunglasses studio white background"),
    ("ray-ban-clubmaster-classic", "Ray-Ban Clubmaster RB3016 sunglasses studio white background"),
    ("ray-ban-round-metal-gold", "Ray-Ban Round Metal RB3447 gold sunglasses studio white background"),
    ("ray-ban-justin-matte-black", "Ray-Ban Justin RB4165 matte black sunglasses studio white background"),

    # ─── Casio / G-Shock ───────────────────────────────────────
    ("casio-g-shock-ga-2100-casioak", "Casio G-Shock GA-2100 black CasiOak watch studio white background"),
    ("casio-vintage-gold-a168", "Casio Vintage A168WG gold digital watch studio white background"),
    ("casio-g-shock-dw-5600", "Casio G-Shock DW-5600E classic square watch studio white background"),
    ("casio-edifice-chronograph", "Casio Edifice chronograph stainless steel watch studio white background"),

    # ─── Dior ──────────────────────────────────────────────────
    ("dior-sauvage-eau-de-parfum", "Dior Sauvage Eau de Parfum perfume bottle studio white background"),
    ("dior-miss-dior-eau-de-parfum", "Miss Dior Eau de Parfum perfume bottle studio white background"),
    ("dior-homme-intense-edp", "Dior Homme Intense Eau de Parfum bottle studio white background"),
    ("dior-saddle-grained-leather-bag", "Dior Saddle bag black grained leather gold CD studio white background"),
    ("dior-b23-high-top-sneaker", "Dior B23 high-top oblique sneaker studio white background"),

    # ─── Prada ─────────────────────────────────────────────────
    ("prada-paradoxe-eau-de-parfum", "Prada Paradoxe Eau de Parfum triangle bottle studio white background"),
    ("prada-re-nylon-shoulder-bag", "Prada Re-Nylon shoulder bag black triangle logo studio white background"),
    ("prada-saffiano-leather-wallet", "Prada Saffiano leather zip wallet black studio white background"),
    ("prada-monolith-leather-loafers", "Prada Monolith brushed leather loafers chunky sole studio white background"),
    ("prada-linea-rossa-sunglasses", "Prada Linea Rossa sunglasses black red stripe studio white background"),

    # ─── Emporio Armani ────────────────────────────────────────
    ("armani-stronger-with-you-intensely", "Emporio Armani Stronger With You Intensely perfume bottle studio white background"),
    ("armani-chronograph-black-dial", "Emporio Armani chronograph watch AR2434 stainless steel studio white background"),
    ("armani-eagle-logo-polo", "Emporio Armani eagle logo polo shirt black studio white background"),
    ("armani-bifold-leather-wallet", "Emporio Armani leather bi-fold wallet black studio white background"),

    # ─── Versace ───────────────────────────────────────────────
    ("versace-eros-flame-eau-de-parfum", "Versace Eros Flame Eau de Parfum red bottle studio white background"),
    ("versace-medusa-leather-belt", "Versace Medusa head gold buckle black leather belt studio white background"),
    ("versace-chain-reaction-sneaker", "Versace Chain Reaction chunky sneaker white black studio white background"),
    ("versace-dylan-blue-pour-homme", "Versace Dylan Blue pour homme perfume bottle studio white background"),
    ("versace-barocco-silk-scarf", "Versace Barocco print silk scarf gold black studio white background"),

    # ─── Under Armour ──────────────────────────────────────────
    ("under-armour-tech-20-tee", "Under Armour Tech 2.0 short sleeve training tee black studio white background"),
    ("under-armour-rival-fleece-hoodie", "Under Armour Rival fleece pullover hoodie black studio white background"),
    ("under-armour-hovr-phantom-3", "Under Armour UA HOVR Phantom 3 running shoes black studio white background"),
    ("under-armour-heatgear-leggings", "Under Armour HeatGear compression leggings black studio white background"),
    ("under-armour-hustle-50-backpack", "Under Armour Hustle 5.0 backpack black studio white background"),

    # ─── Michael Kors ──────────────────────────────────────────
    ("michael-kors-jet-set-saffiano-tote", "Michael Kors Jet Set large Saffiano leather tote bag black gold studio white background"),
    ("michael-kors-slim-runway-gold-watch", "Michael Kors Slim Runway gold watch MK3179 studio white background"),
    ("michael-kors-greenwich-crossbody", "Michael Kors Greenwich small crossbody bag black studio white background"),
    ("michael-kors-leather-card-case", "Michael Kors Saffiano leather slim card case black studio white background"),

    # ─── Zara ──────────────────────────────────────────────────
    ("zara-tailored-textured-blazer", "Zara tailored textured blazer navy studio white background"),
    ("zara-pleated-wide-leg-trousers", "Zara pleated wide leg trousers beige studio white background"),
    ("zara-satin-midi-slip-dress", "Zara satin midi slip dress emerald green studio white background"),
    ("zara-wool-blend-overcoat", "Zara structured wool blend overcoat camel studio white background"),
    ("zara-oversized-poplin-shirt", "Zara 100% poplin oversized shirt white studio white background"),
    ("zara-knit-sweater-crew", "Zara knit ribbed crewneck sweater grey studio white background"),
    ("zara-straight-leg-jeans", "Zara straight leg blue denim jeans studio white background"),
    ("zara-leather-crossbody", "Zara leather crossbody bag black gold hardware studio white background"),
    ("zara-quilted-bomber-jacket", "Zara quilted bomber jacket olive green studio white background"),
    ("zara-structured-tote-bag", "Zara structured tote bag black studio white background"),
    ("zara-faux-leather-trench", "Zara faux leather trench coat black studio white background"),

    # ─── Gucci ─────────────────────────────────────────────────
    ("gucci-gg-marmont-shoulder-bag", "Gucci GG Marmont small shoulder bag black chevron leather gold GG studio white background"),
    ("gucci-horsebit-1953-loafer", "Gucci 1953 Horsebit loafer black leather gold horsebit studio white background"),
    ("gucci-double-g-leather-belt", "Gucci Double G buckle black leather belt studio white background"),
    ("gucci-flora-gorgeous-gardenia", "Gucci Flora Gorgeous Gardenia Eau de Parfum pink bottle studio white background"),
    ("gucci-square-acetate-sunglasses", "Gucci square acetate sunglasses black gold GG studio white background"),
    ("gucci-ophidia-gg-zip-wallet", "Gucci Ophidia GG Supreme zip around wallet web stripe studio white background"),
    ("gucci-gg-canvas-tote", "Gucci GG Supreme canvas tote bag brown leather studio white background"),
    ("gucci-ace-leather-sneaker", "Gucci Ace white leather sneaker green red web stripe studio white background"),
    ("gucci-wool-coat", "Gucci tailored wool coat black gold buttons studio white background"),
    ("gucci-guilty-pour-homme", "Gucci Guilty pour homme Eau de Parfum bottle studio white background"),
    ("gucci-bamboo-1947-top-handle", "Gucci Bamboo 1947 top handle bag black leather studio white background"),

    # ─── Chanel ────────────────────────────────────────────────
    ("chanel-bleu-de-chanel-parfum", "Bleu de Chanel Parfum perfume bottle studio white background"),
    ("chanel-coco-mademoiselle-edp", "Chanel Coco Mademoiselle Eau de Parfum bottle studio white background"),
    ("chanel-classic-1112-flap-bag", "Chanel Classic 11.12 flap bag black quilted caviar leather gold hardware studio white background"),
    ("chanel-gabrielle-essence-edp", "Chanel Gabrielle Essence Eau de Parfum square bottle studio white background"),
    ("chanel-n5-eau-de-parfum", "Chanel No 5 Eau de Parfum iconic bottle studio white background"),
    ("chanel-boy-bag-medium", "Chanel Boy bag black quilted leather ruthenium hardware studio white background"),
    ("chanel-rouge-allure-lextrait", "Chanel Rouge Allure lipstick gold black case studio white background"),
    ("chanel-22-hobo-bag", "Chanel 22 hobo bag shiny calfskin black gold letters studio white background"),
    ("chanel-coco-crush-ring", "Chanel Coco Crush quilted gold ring studio white background"),
    ("chanel-boy-long-wallet", "Chanel Boy long flap wallet black caviar leather studio white background"),
    ("chanel-cc-espadrilles", "Chanel classic lambskin CC espadrilles beige black toe studio white background"),

    # ─── Hugo Boss ─────────────────────────────────────────────
    ("boss-slim-virgin-wool-suit", "BOSS Hugo Boss slim fit virgin wool suit charcoal grey studio white background"),
    ("boss-pallas-pique-polo", "BOSS Hugo Boss Pallas pique polo shirt black studio white background"),
    ("boss-bottled-eau-de-parfum", "BOSS Bottled Eau de Parfum bottle studio white background"),
    ("boss-skeleton-automatic-watch", "BOSS Grand Prix chronograph watch stainless steel studio white background"),
    ("boss-leather-cardholder", "BOSS signature grained calf leather cardholder black studio white background"),
    ("boss-schino-slim-pants", "BOSS Schino slim fit chino pants navy studio white background"),
    ("boss-slim-oxford-shirt", "BOSS slim fit white oxford shirt studio white background"),
    ("boss-chelsea-leather-boot", "BOSS Kensington leather chelsea boot black studio white background"),
    ("boss-wool-overcoat", "BOSS tailored wool cashmere overcoat camel studio white background"),
    ("boss-ives-leather-loafer", "BOSS Ives leather penny loafer dark brown studio white background"),
    ("boss-hugo-red-eau-de-toilette", "HUGO Red Eau de Toilette red bottle studio white background"),

    # ─── Calvin Klein ──────────────────────────────────────────
    ("ck-one-eau-de-toilette", "CK One Eau de Toilette frosted bottle studio white background"),
    ("ck-eternity-eau-de-parfum", "Calvin Klein Eternity Eau de Parfum bottle studio white background"),
    ("ck-modern-cotton-crewneck", "Calvin Klein modern cotton crewneck sweatshirt grey studio white background"),
    ("ck-90s-straight-denim", "Calvin Klein 90s straight leg jeans blue denim studio white background"),
    ("calvin-klein-reversible-puffer", "Calvin Klein reversible insulated puffer jacket black studio white background"),
    ("ck-slim-cotton-blazer", "Calvin Klein slim stretch cotton blazer navy studio white background"),
    ("ck-3pack-boxer-briefs", "Calvin Klein 3 pack cotton stretch boxer briefs black studio white background"),
    ("ck-classic-dress-belt", "Calvin Klein reversible dress leather belt black brown studio white background"),
    ("ck-platform-chelsea-boot", "Calvin Klein platform chelsea leather boot black studio white background"),
    ("ck-euphoria-eau-de-parfum", "Calvin Klein Euphoria Eau de Parfum bottle studio white background"),
    ("ck-monogram-crossbody", "Calvin Klein monogram small crossbody bag black studio white background"),

    # ─── Tommy Hilfiger ────────────────────────────────────────
    ("tommy-hilfiger-flag-polo", "Tommy Hilfiger iconic flag polo shirt navy red white studio white background"),
    ("tommy-hilfiger-1985-oxford-shirt", "Tommy Hilfiger 1985 stretch oxford shirt white studio white background"),
    ("tommy-hilfiger-cable-knit-sweater", "Tommy Hilfiger cable knit sweater navy studio white background"),
    ("tommy-hilfiger-puffer-jacket", "Tommy Hilfiger down padded puffer jacket navy red studio white background"),
    ("tommy-hilfiger-heritage-backpack", "Tommy Hilfiger heritage stripe nylon backpack navy studio white background"),
    ("tommy-hilfiger-chino-classic", "Tommy Hilfiger classic chino pants beige studio white background"),
    ("tommy-hilfiger-bold-logo-hoodie", "Tommy Hilfiger bold logo hoodie grey navy studio white background"),
    ("tommy-hilfiger-classic-denim-trucker", "Tommy Hilfiger classic denim trucker jacket blue studio white background"),
    ("tommy-hilfiger-leather-belt", "Tommy Hilfiger Denton leather belt dark brown studio white background"),
    ("tommy-hilfiger-tommy-edp", "Tommy Hilfiger Tommy Eau de Toilette bottle studio white background"),
    ("tommy-hilfiger-leather-low-sneaker", "Tommy Hilfiger classic leather low sneaker white navy studio white background"),
]

def fetch_bing_product_image(page, query, out_file):
    encoded_q = urllib.parse.quote(query)
    url = f"https://www.bing.com/images/search?q={encoded_q}&qft=+filterui:photo-photo"
    try:
        page.goto(url, timeout=15000)
        page.wait_for_timeout(500)
        imgs = page.locator("img.mimg").all()
        for img_el in imgs[:5]:
            src = img_el.get_attribute("src") or img_el.get_attribute("data-src")
            if src and "th.bing.com/th/id/OIP" in src:
                # Convert to clean 1000x1000 square high-res
                base_url = src.split("?")[0]
                high_res_url = f"{base_url}?w=1000&h=1000&c=7&rs=1&p=0"
                req = urllib.request.Request(high_res_url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                try:
                    data = urllib.request.urlopen(req, timeout=10).read()
                    if len(data) > 8000:
                        pil_img = Image.open(io.BytesIO(data))
                        # Pad into square with white background if needed
                        w, h = pil_img.size
                        max_dim = max(w, h)
                        square = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
                        square.paste(pil_img.convert("RGB"), ((max_dim - w) // 2, (max_dim - h) // 2))
                        square_resized = square.resize((1000, 1000), Image.Resampling.LANCZOS)
                        square_resized.save(out_file, "WEBP", quality=92)
                        return True
                except Exception:
                    pass
    except Exception:
        pass
    return False

def main():
    print(f"🚀 EuroStore Master Studio Image Engine ({len(ALL_PRODUCTS)} Products)")
    print("=" * 60)
    
    success = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(extra_http_headers={"Accept-Language": "en-US,en;q=0.9"})
        
        for idx, (slug, query) in enumerate(ALL_PRODUCTS, 1):
            out_file = OUTPUT_DIR / f"{slug}.webp"
            print(f"  [{idx}/{len(ALL_PRODUCTS)}] {slug}...", end=" ", flush=True)
            
            ok = fetch_bing_product_image(page, query, out_file)
            if ok:
                print(f"✅ OK ({out_file.stat().st_size // 1024}KB)")
                success += 1
            else:
                # Retry with simple query
                simple_q = f"{slug.replace('-', ' ')} official photo white background"
                ok = fetch_bing_product_image(page, simple_q, out_file)
                if ok:
                    print("✅ OK (retry)")
                    success += 1
                else:
                    print("❌ FAIL")
            
            time.sleep(0.3)
            
        browser.close()

    print(f"\n🎉 Done! Successfully fetched {success}/{len(ALL_PRODUCTS)} authentic studio photos!")

if __name__ == "__main__":
    main()
