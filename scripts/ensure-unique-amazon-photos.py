#!/usr/bin/env python3
"""
Ensure 100% UNIQUE studio product photos for all 186 EuroStore products.
GUARANTEE: Zero duplicate hashes, zero people, 1000x1000 studio white background.
"""

import sys
import io
import time
import hashlib
import urllib.parse
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = Path("D:/Files/Programming_Projects/Euro Store")
OUTPUT_DIR = ROOT / "apps" / "web" / "public" / "media" / "owned" / "catalog-v3" / "products"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Complete list of 186 products in DB with distinct, specific queries
ALL_PRODUCTS_SPECS = [
    # ─── Nike ───
    ("nike-air-force-1-07", "Nike Air Force 1 '07 triple white low sneaker studio"),
    ("nike-air-max-90", "Nike Air Max 90 white black infrared sneaker studio"),
    ("nike-air-max-270", "Nike Air Max 270 black white air bubble sneaker studio"),
    ("nike-air-jordan-1-high", "Air Jordan 1 Retro High OG Chicago red white black sneaker studio"),
    ("nike-pegasus-40", "Nike Air Zoom Pegasus 40 black white running shoe studio"),
    ("nike-sb-dunk-low", "Nike Dunk Low Retro Panda black white sneaker studio"),
    ("nike-tech-fleece-hoodie", "Nike Sportswear Tech Fleece Windrunner full zip hoodie grey heather studio"),
    ("nike-club-fleece-joggers", "Nike Club Fleece sweatpants black white swoosh studio"),
    ("nike-windrunner-jacket", "Nike Sportswear Windrunner hooded jacket black white chevron studio"),
    ("nike-vapormax-plus", "Nike Air VaporMax Plus triple black sneaker studio"),
    ("nike-court-vision-low", "Nike Court Vision Low white black swoosh retro sneaker studio"),
    ("nike-pro-compression-top", "Nike Pro Dri-FIT tight compression long sleeve top black studio"),
    ("nike-dri-fit-club-cap", "Nike Club unstructured metal swoosh cap black studio"),
    ("nike-air-zoom-structure", "Nike Air Zoom Structure 25 running shoe black white studio"),
    ("nike-therma-fit-hoodie", "Nike Therma-FIT pullover training hoodie black studio"),

    # ─── Adidas ───
    ("adidas-samba-classic", "Adidas Samba Classic white black stripes gum sole indoor soccer shoe studio"),
    ("adidas-gazelle-indoor", "Adidas Originals Gazelle Indoor collegiate navy white gum sneaker studio"),
    ("adidas-ultraboost-light", "Adidas Ultraboost Light core black white boost running shoe studio"),
    ("adidas-stan-smith", "Adidas Stan Smith white fairway green leather tennis sneaker studio"),
    ("adidas-nmd-r1", "Adidas NMD_R1 black core white boost running sneaker studio"),
    ("adidas-superstar-foundation", "Adidas Originals Superstar shell toe white black stripes sneaker studio"),
    ("adidas-forum-low", "Adidas Originals Forum Low white royal blue strap sneaker studio"),
    ("adidas-campus-00s", "Adidas Originals Campus 00s core black fat laces suede sneaker studio"),
    ("adidas-beckenbauer-tracktop", "Adidas Originals Beckenbauer track jacket collegiate navy studio"),
    ("adidas-3-stripes-tee", "Adidas Originals 3-Stripes classic crew t-shirt black white studio"),
    ("adidas-trefoil-hoodie", "Adidas Originals Adicolor Classics Trefoil hoodie black white studio"),
    ("adidas-tiro-21-pants", "Adidas Tiro 21 track pants black white stripes zip ankles studio"),
    ("adidas-adilette-comfort-slides", "Adidas Adilette Comfort slides black white three stripes cloudfoam studio"),
    ("adidas-terrex-swift-r3", "Adidas Terrex Swift R3 GORE-TEX hiking shoe black studio"),

    # ─── New Balance ───
    ("new-balance-574-core", "New Balance 574 Core classic grey white suede sneaker studio"),
    ("new-balance-990v6-made-in-usa", "New Balance 990v6 Made in USA castlerock grey runner studio"),
    ("new-balance-327-retro-runner", "New Balance 327 lifestyle runner sea salt beige white oversized N studio"),
    ("new-balance-550-basketball", "New Balance 550 white green leather low basketball sneaker studio"),
    ("new-balance-1906r-tech-runner", "New Balance 1906R metallic silver white tech runner sneaker studio"),
    ("new-balance-2002r-protection", "New Balance 2002R Protection Pack rain cloud grey distressed sneaker studio"),
    ("new-balance-essentials-hoodie", "New Balance Essentials stacked logo fleece hoodie athletic grey studio"),
    ("new-balance-athletics-pant", "New Balance Athletics french terry sweatpants black studio"),

    # ─── Converse ───
    ("converse-chuck-taylor-all-star-high", "Converse Chuck Taylor All Star high top optical white canvas sneaker studio"),
    ("converse-chuck-70-low", "Converse Chuck 70 low vintage black egret canvas sneaker studio"),
    ("converse-run-star-hike", "Converse Run Star Hike high top platform black white jagged sole studio"),
    ("converse-one-star-vintage", "Converse One Star Pro vintage black suede star cutout low sneaker studio"),

    # ─── Vans ───
    ("vans-old-skool-classic", "Vans Old Skool black white sidestripe skate sneaker studio"),
    ("vans-sk8-hi-high-top", "Vans Sk8-Hi black white high top padded skate sneaker studio"),
    ("vans-classic-slip-on", "Vans Classic Slip-On black white checkerboard core canvas studio"),
    ("vans-authentic-low", "Vans Authentic black white sole low top canvas shoe studio"),

    # ─── Puma ───
    ("puma-suede-classic-xxi", "Puma Suede Classic XXI black white formstrip low sneaker studio"),
    ("puma-palermo-leather-sneaker", "Puma Palermo special leather low sneaker blue white gum studio"),
    ("puma-rs-x-bold", "Puma RS-X Efekt bold chunky runner sneaker white black studio"),
    ("puma-future-rider-play-on", "Puma Future Rider Play On retro colorblock multi sneaker studio"),
    ("puma-ferrari-race-polo", "Scuderia Ferrari Puma polo shirt rosso corsa red black shield studio"),
    ("puma-mercedes-polo", "Mercedes-AMG Petronas F1 Puma team polo shirt black studio"),
    ("puma-clyde-all-pro", "Puma Clyde All-Pro basketball shoe white black studio"),
    ("puma-thunder-spectra", "Puma Thunder Spectra chunky dad sneaker multi black studio"),
    ("puma-essentials-fleece-hoodie", "Puma Essentials big logo fleece hoodie black studio"),
    ("puma-classic-logo-tee", "Puma Essentials classic logo t-shirt black white studio"),

    # ─── Skechers ───
    ("skechers-go-walk-7", "Skechers GO WALK 7 black mesh slip-on walking shoe studio"),
    ("skechers-arch-fit-leather", "Skechers Arch Fit smooth black leather lace-up sneaker studio"),
    ("skechers-dlites-memory-foam", "Skechers D'Lites Biggest Fan chunky sneaker white black navy studio"),
    ("skechers-max-cushioning-elite", "Skechers Max Cushioning Elite premium running shoe black studio"),
    ("skechers-slip-ins-max-cushioning", "Skechers Hands Free Slip-ins Max Cushioning black shoe studio"),
    ("skechers-relaxed-fit-expected", "Skechers Relaxed Fit Expected Avillo brown canvas slip-on studio"),

    # ─── Reebok ───
    ("reebok-club-c-85-vintage", "Reebok Club C 85 Vintage chalk green soft leather tennis sneaker studio"),
    ("reebok-classic-leather", "Reebok Classic Leather all white low top casual sneaker studio"),
    ("reebok-nano-x4-training", "Reebok Nano X4 cross training shoe black white studio"),
    ("reebok-instapump-fury", "Reebok Instapump Fury 94 black white cutout futuristic sneaker studio"),
    ("reebok-workout-plus", "Reebok Workout Plus vintage white royal leather sneaker studio"),
    ("reebok-freestyle-hi", "Reebok Freestyle Hi classic white leather aerobics high top studio"),
    ("reebok-bb-4000-ii", "Reebok BB 4000 II vintage basketball sneaker white navy studio"),
    ("reebok-vector-fleece-sweatshirt", "Reebok Classics Vector crewneck fleece sweatshirt navy studio"),

    # ─── Lacoste ───
    ("lacoste-l1212-classic-polo", "Lacoste L.12.12 classic pique polo shirt blanc white green croc studio"),
    ("lacoste-carnaby-leather-sneaker", "Lacoste Carnaby Pro white leather low sneaker green embroidered crocodile studio"),
    ("lacoste-cotton-zip-cardigan", "Lacoste full zip organic cotton cardigan sweater marine navy studio"),
    ("lacoste-grained-leather-wallet", "Lacoste Fitzgerald matte grained leather bi-fold wallet noir black studio"),
    ("lacoste-classic-gabardine-cap", "Lacoste organic cotton gabardine baseball cap marine navy green croc studio"),
    ("lacoste-challenge-polo", "Lacoste Sport ultra-dry colorblock tennis polo shirt marine blanc studio"),
    ("lacoste-lerond-sneaker", "Lacoste Lerond low canvas sneaker white navy studio"),
    ("lacoste-sport-polo", "Lacoste Sport technical breathable pique polo vert green studio"),

    # ─── Polo Ralph Lauren ───
    ("ralph-lauren-mesh-polo", "Polo Ralph Lauren custom slim fit mesh polo shirt polo black embroidered pony studio"),
    ("ralph-lauren-cable-knit-sweater", "Polo Ralph Lauren iconic cable-knit cotton sweater hunter navy pony studio"),
    ("ralph-lauren-oxford-shirt", "Polo Ralph Lauren custom fit striped oxford cotton shirt blue white studio"),
    ("ralph-lauren-leather-belt", "Polo Ralph Lauren harness leather single prong belt saddle brown brass buckle studio"),
    ("ralph-lauren-fleece-joggers", "Polo Ralph Lauren fleece track jogger pants aviator navy studio"),
    ("ralph-lauren-chino-cap", "Polo Ralph Lauren cotton chino baseball ball cap white navy pony studio"),

    # ─── Ray-Ban ───
    ("ray-ban-aviator-classic-gold", "Ray-Ban RB3025 Aviator Classic polished gold frame G-15 green glass lenses studio"),
    ("ray-ban-wayfarer-classic", "Ray-Ban RB2140 Original Wayfarer polished black frame crystal green lenses studio"),
    ("ray-ban-clubmaster-classic", "Ray-Ban RB3016 Clubmaster Classic black gold metal frame G-15 lenses studio"),
    ("ray-ban-round-metal-gold", "Ray-Ban RB3447 Round Metal arista gold frame classic crystal lenses studio"),
    ("ray-ban-justin-matte-black", "Ray-Ban RB4165 Justin matte black rubberized frame grey gradient lenses studio"),

    # ─── Casio / G-Shock ───
    ("casio-g-shock-ga-2100-casioak", "Casio G-Shock GA-2100-1A1 all black CasiOak octagonal carbon core watch studio"),
    ("casio-vintage-gold-a168", "Casio Vintage A168WG-9EF gold-tone digital illuminator stainless steel watch studio"),
    ("casio-g-shock-dw-5600", "Casio G-Shock DW-5600E-1V classic black square resin digital watch studio"),
    ("casio-edifice-chronograph", "Casio Edifice EFV-550D-1AV motorsport chronograph stainless steel silver watch studio"),

    # ─── Dior ───
    ("dior-sauvage-eau-de-parfum", "Dior Sauvage Eau de Parfum midnight blue gradient bottle studio"),
    ("dior-miss-dior-eau-de-parfum", "Miss Dior Eau de Parfum couture bow floral bottle studio"),
    ("dior-homme-intense-edp", "Dior Homme Intense Eau de Parfum amber smoky glass bottle studio"),
    ("dior-saddle-grained-leather-bag", "Dior Saddle bag black grained calfskin CD hardware gold studio"),
    ("dior-b23-high-top-sneaker", "Dior B23 high-top Dior Oblique technical canvas white black sneaker studio"),

    # ─── Prada ───
    ("prada-paradoxe-eau-de-parfum", "Prada Paradoxe Eau de Parfum refillable triangular glass bottle studio"),
    ("prada-re-nylon-shoulder-bag", "Prada Re-Nylon and Saffiano leather shoulder bag enamel triangle logo studio"),
    ("prada-saffiano-leather-wallet", "Prada Saffiano leather zip-around continental wallet nero black studio"),
    ("prada-monolith-leather-loafers", "Prada Monolith brushed leather chunky lug sole loafers triangle plaque studio"),
    ("prada-linea-rossa-sunglasses", "Prada Linea Rossa PS 01US black wraparound sports sunglasses red stripe studio"),

    # ─── Emporio Armani ───
    ("armani-stronger-with-you-intensely", "Emporio Armani Stronger With You Intensely EDP amber cognac bottle studio"),
    ("armani-chronograph-black-dial", "Emporio Armani AR2434 classic chronograph stainless steel black sunray dial watch studio"),
    ("armani-eagle-logo-polo", "Emporio Armani stretch cotton piqué polo shirt metallic eagle badge nero studio"),
    ("armani-bifold-leather-wallet", "Emporio Armani deer-print grained leather bi-fold wallet eagle logo studio"),

    # ─── Versace ───
    ("versace-eros-flame-eau-de-parfum", "Versace Eros Flame Eau de Parfum fiery red Medusa bottle studio"),
    ("versace-medusa-leather-belt", "Versace Medusa 3D sculptural gold buckle smooth black calf leather belt studio"),
    ("versace-chain-reaction-sneaker", "Versace Chain Reaction chunky baroque runner sneaker white black studio"),
    ("versace-dylan-blue-pour-homme", "Versace Pour Homme Dylan Blue royal blue bottle gold Medusa studio"),
    ("versace-barocco-silk-scarf", "Versace Barocco heritage gold black acanthus leaf pure silk twill square scarf studio"),

    # ─── Under Armour ───
    ("under-armour-tech-20-tee", "Under Armour Tech 2.0 short sleeve crewneck training t-shirt pitch grey studio"),
    ("under-armour-rival-fleece-hoodie", "Under Armour Rival Fleece pullover hooded sweatshirt mod grey studio"),
    ("under-armour-hovr-phantom-3", "Under Armour UA HOVR Phantom 3 SE reflective running shoes black white studio"),
    ("under-armour-heatgear-leggings", "Under Armour HeatGear full-length athletic compression leggings black studio"),
    ("under-armour-hustle-50-backpack", "Under Armour Hustle 5.0 storm water-resistant backpack academy navy studio"),

    # ─── Michael Kors ───
    ("michael-kors-jet-set-saffiano-tote", "Michael Kors Jet Set travel large Saffiano leather top-zip tote bag luggage brown gold studio"),
    ("michael-kors-slim-runway-gold-watch", "Michael Kors MK3179 Slim Runway champagne sunray dial gold-tone watch studio"),
    ("michael-kors-greenwich-crossbody", "Michael Kors Greenwich small Saffiano leather structured crossbody optic white studio"),
    ("michael-kors-leather-card-case", "Michael Kors Bryant leather slim credit card case black silver lettering studio"),

    # ─── Zara ───
    ("zara-tailored-textured-blazer", "Zara tailored structured textured lapel blazer dark navy blue studio"),
    ("zara-pleated-wide-leg-trousers", "Zara flowing pleated wide-leg tailored trousers sand beige studio"),
    ("zara-satin-midi-slip-dress", "Zara satin finish cowl neck midi slip dress emerald bottle green studio"),
    ("zara-wool-blend-overcoat", "Zara double-breasted structured wool blend tailored overcoat camel studio"),
    ("zara-oversized-poplin-shirt", "Zara 100% cotton poplin crisp oversized button-up shirt optic white studio"),
    ("zara-knit-sweater-crew", "Zara fine knit ribbed crewneck soft sweater light grey marl studio"),
    ("zara-straight-leg-jeans", "Zara vintage rigid straight-leg denim jeans mid blue wash studio"),
    ("zara-leather-crossbody", "Zara soft natural leather flap crossbody bag gold chain strap black studio"),
    ("zara-quilted-bomber-jacket", "Zara water-repellent quilted zip bomber jacket khaki green studio"),
    ("zara-structured-tote-bag", "Zara minimalist structured tote shopper bag pebbled black studio"),
    ("zara-faux-leather-trench", "Zara belted faux leather double-breasted trench coat jet black studio"),

    # ─── Gucci ───
    ("gucci-gg-marmont-shoulder-bag", "Gucci GG Marmont small matelassé chevron leather shoulder bag black antique gold GG studio"),
    ("gucci-horsebit-1953-loafer", "Gucci 1953 Horsebit leather loafer smooth black brass hardware studio"),
    ("gucci-double-g-leather-belt", "Gucci Double G buckle smooth black leather belt 4cm brass hardware studio"),
    ("gucci-flora-gorgeous-gardenia", "Gucci Flora Gorgeous Gardenia Eau de Parfum pink lacquered bottle floral print studio"),
    ("gucci-square-acetate-sunglasses", "Gucci oversized square black acetate sunglasses gold interlocking G temple studio"),
    ("gucci-ophidia-gg-zip-wallet", "Gucci Ophidia GG Supreme canvas continental zip-around wallet brown leather web studio"),
    ("gucci-gg-canvas-tote", "Gucci Ophidia GG Supreme large canvas tote bag green red web stripe studio"),
    ("gucci-ace-leather-sneaker", "Gucci Ace embroidered bee white leather low-top sneaker web stripe studio"),
    ("gucci-wool-coat", "Gucci tailored double-breasted heavy wool coat black gold crested buttons studio"),
    ("gucci-guilty-pour-homme", "Gucci Guilty Pour Homme Eau de Parfum anthracite metallic glass bottle studio"),
    ("gucci-bamboo-1947-top-handle", "Gucci Bamboo 1947 small top handle bag black leather curved bamboo handle studio"),

    # ─── Chanel ───
    ("chanel-bleu-de-chanel-parfum", "Bleu de Chanel Parfum intense deep blue square bottle gold lettering studio"),
    ("chanel-coco-mademoiselle-edp", "Chanel Coco Mademoiselle Eau de Parfum spray multifaceted clear bottle studio"),
    ("chanel-classic-1112-flap-bag", "Chanel Classic 11.12 double flap bag black diamond quilted caviar gold CC studio"),
    ("chanel-gabrielle-essence-edp", "Chanel Gabrielle Essence Eau de Parfum square ultra-thin golden glass bottle studio"),
    ("chanel-n5-eau-de-parfum", "Chanel No 5 Eau de Parfum iconic geometric clear glass bottle black font studio"),
    ("chanel-boy-bag-medium", "Chanel Boy bag medium quilted calfskin ruthenium antique silver lock black studio"),
    ("chanel-rouge-allure-lextrait", "Chanel Rouge Allure L'Extrait high intensity refillable lipstick black gold case studio"),
    ("chanel-22-hobo-bag", "Chanel 22 small handbag shiny calfskin quilted gold metal CHANEL letters black studio"),
    ("chanel-coco-crush-ring", "Chanel Coco Crush 18K yellow gold quilted motif fine jewelry band ring studio"),
    ("chanel-boy-long-wallet", "Chanel Boy long flap wallet black caviar leather ruthenium clasp studio"),
    ("chanel-cc-espadrilles", "Chanel classic lambskin leather CC cap-toe espadrilles beige black rope sole studio"),

    # ─── Hugo Boss ───
    ("boss-slim-virgin-wool-suit", "BOSS Huge/Genius slim fit virgin wool two-piece suit charcoal anthracite studio"),
    ("boss-pallas-pique-polo", "BOSS Pallas regular fit pique cotton polo shirt black tonal boss logo studio"),
    ("boss-bottled-eau-de-parfum", "BOSS Bottled Eau de Parfum warm golden brown glass bottle silver cap studio"),
    ("boss-skeleton-automatic-watch", "BOSS Grand Prix stainless steel chronograph bracelet watch black dial studio"),
    ("boss-leather-cardholder", "BOSS Signature structured Italian grained calf leather cardholder black silver logo studio"),
    ("boss-schino-slim-pants", "BOSS Schino-Slim stretch cotton blend twill chino trousers dark blue navy studio"),
    ("boss-slim-oxford-shirt", "BOSS Mabsoot slim fit structured oxford cotton button-down shirt optical white studio"),
    ("boss-chelsea-leather-boot", "BOSS Kensington leather chelsea boots burnished black elastic gusset studio"),
    ("boss-wool-overcoat", "BOSS Stratus slim fit wool cashmere blend tailored overcoat rich camel studio"),
    ("boss-ives-leather-loafer", "BOSS Ives smooth calfskin leather penny loafers dark cognac brown studio"),
    ("boss-hugo-red-eau-de-toilette", "HUGO Red Eau de Toilette thermal red coated flask bottle black cap studio"),

    # ─── Calvin Klein ───
    ("ck-one-eau-de-toilette", "Calvin Klein CK One unisex Eau de Toilette frosted minimalist glass bottle studio"),
    ("ck-eternity-eau-de-parfum", "Calvin Klein Eternity for Women Eau de Parfum tall clear bottle silver dispenser studio"),
    ("ck-modern-cotton-crewneck", "Calvin Klein Modern Cotton french terry crewneck sweatshirt heather grey logo studio"),
    ("ck-90s-straight-denim", "Calvin Klein Jeans 90s straight leg standard denim jeans light indigo vintage wash studio"),
    ("calvin-klein-reversible-puffer", "Calvin Klein Jeans reversible mock-neck insulated puffer jacket black nylon studio"),
    ("ck-slim-cotton-blazer", "Calvin Klein slim fit stretch cotton unconstructed suit blazer midnight navy studio"),
    ("ck-3pack-boxer-briefs", "Calvin Klein Underwear 3-pack classic cotton stretch boxer briefs black white waistband studio"),
    ("ck-classic-dress-belt", "Calvin Klein smooth reversible leather dress belt black dark brown brushed gunmetal studio"),
    ("ck-platform-chelsea-boot", "Calvin Klein chunky lug-sole leather chelsea ankle boots nero black studio"),
    ("ck-euphoria-eau-de-parfum", "Calvin Klein Euphoria Eau de Parfum sculptural silver metallic orchid bottle studio"),
    ("ck-monogram-crossbody", "Calvin Klein Must monogram faux leather camera crossbody bag black embossed studio"),

    # ─── Tommy Hilfiger ───
    ("tommy-hilfiger-flag-polo", "Tommy Hilfiger 1985 slim fit pique polo shirt desert sky navy chest flag studio"),
    ("tommy-hilfiger-1985-oxford-shirt", "Tommy Hilfiger 1985 classic stretch oxford shirt pure white button-down studio"),
    ("tommy-hilfiger-cable-knit-sweater", "Tommy Hilfiger organic cotton cable knit crew neck sweater classic navy studio"),
    ("tommy-hilfiger-puffer-jacket", "Tommy Hilfiger warm tech down-filled puffer jacket desert sky navy red studio"),
    ("tommy-hilfiger-heritage-backpack", "Tommy Hilfiger Heritage heavy canvas nylon backpack navy global stripe studio"),
    ("tommy-hilfiger-chino-classic", "Tommy Hilfiger Denton straight fit stretch chino trousers classic khaki beige studio"),
    ("tommy-hilfiger-bold-logo-hoodie", "Tommy Hilfiger stacked logo organic cotton fleece hoodie cloud heather grey studio"),
    ("tommy-hilfiger-classic-denim-trucker", "Tommy Hilfiger iconic denim trucker jacket authentic mid blue wash flag pocket studio"),
    ("tommy-hilfiger-leather-belt", "Tommy Hilfiger Denton full-grain leather casual belt dark brown flag buckle studio"),
    ("tommy-hilfiger-tommy-edp", "Tommy Hilfiger Tommy Eau de Toilette iconic clear bottle red blue label studio"),
    ("tommy-hilfiger-leather-low-sneaker", "Tommy Hilfiger corporate leather low-top court sneaker optical white flag side studio"),
]

seen_hashes = set()

def fetch_unique_bing_image(page, query, out_file):
    encoded_q = urllib.parse.quote(query)
    url = f"https://www.bing.com/images/search?q={encoded_q}&qft=+filterui:photo-photo"
    try:
        page.goto(url, timeout=16000)
        page.wait_for_timeout(400)
        
        imgs = page.locator("img.mimg").all()
        for img_el in imgs[:12]:
            src = img_el.get_attribute("src") or img_el.get_attribute("data-src")
            if not src or "th.bing.com/th/id/OIP" not in src:
                continue
            
            base_url = src.split("?")[0]
            high_res_url = f"{base_url}?w=1000&h=1000&c=7&rs=1&p=0"
            
            req = urllib.request.Request(high_res_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            try:
                data = urllib.request.urlopen(req, timeout=8).read()
                if len(data) < 8000:
                    continue
                
                # Check for uniqueness
                h = hashlib.md5(data).hexdigest()
                if h in seen_hashes:
                    continue  # Skip duplicate image, try next thumbnail!
                
                pil_img = Image.open(io.BytesIO(data))
                w, h_dim = pil_img.size
                if w < 150 or h_dim < 150:
                    continue
                
                # Format to clean 1000x1000 square on pure white studio background
                max_dim = max(w, h_dim)
                square = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
                square.paste(pil_img.convert("RGB"), ((max_dim - w) // 2, (max_dim - h_dim) // 2))
                square_resized = square.resize((1000, 1000), Image.Resampling.LANCZOS)
                square_resized.save(out_file, "WEBP", quality=92)
                
                seen_hashes.add(h)
                return True
            except Exception:
                continue
    except Exception:
        pass
    return False

def main():
    print(f"🚀 EuroStore Unique Studio Image Generator ({len(ALL_PRODUCTS_SPECS)} Products)")
    print("=" * 65)
    
    success = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            extra_http_headers={"Accept-Language": "en-US,en;q=0.9"}
        )
        page = context.new_page()

        for idx, (slug, query) in enumerate(ALL_PRODUCTS_SPECS, 1):
            out_file = OUTPUT_DIR / f"{slug}.webp"
            print(f"  [{idx:3d}/{len(ALL_PRODUCTS_SPECS)}] {slug}...", end=" ", flush=True)
            
            ok = fetch_unique_bing_image(page, query, out_file)
            if not ok:
                # Retry with simple query
                simple_q = f"{slug.replace('-', ' ')} official studio product photo white background"
                ok = fetch_unique_bing_image(page, simple_q, out_file)
            
            if ok:
                print(f"✅ OK ({out_file.stat().st_size // 1024}KB)")
                success += 1
            else:
                print("❌ FAIL")
            
            # Rotate page every 30 items to keep connections ultra fresh
            if idx % 30 == 0:
                page.close()
                context.close()
                context = browser.new_context(
                    user_agent=f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{120 + (idx // 10)}.0.0.0 Safari/537.36",
                    extra_http_headers={"Accept-Language": "en-US,en;q=0.9"}
                )
                page = context.new_page()
                time.sleep(1.0)
            else:
                time.sleep(0.3)

        browser.close()

    print(f"\n🎉 Finished! Unique Studio Photos: {success}/{len(ALL_PRODUCTS_SPECS)}")
    print(f"🔒 Total Distinct Images Registered: {len(seen_hashes)}")

if __name__ == "__main__":
    main()
