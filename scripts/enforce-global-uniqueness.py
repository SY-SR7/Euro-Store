#!/usr/bin/env python3
"""
Final Uniqueness Solver: Ensures 186/186 distinct hashes across the entire catalog.
"""

import io
import time
import hashlib
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

p = Path("D:/Files/Programming_Projects/Euro Store/apps/web/public/media/owned/catalog-v3/products")

DUP_TARGETS = [
    ("adidas-adilette-comfort-slides", "Adidas Adilette slides black white 3 stripes footwear"),
    ("adidas-terrex-swift-r3", "Adidas Terrex Swift R3 GTX hiking shoe black outdoor"),
    ("adidas-samba-classic", "Adidas Samba Classic indoor leather soccer shoe white black"),
    ("adidas-stan-smith-leather", "Adidas Stan Smith white green tennis sneaker classic"),
    ("adidas-forum-low-white", "Adidas Forum Low white royal blue strap low top"),
    ("adidas-superstar-shell-toe", "Adidas Superstar shell toe white black stripes original"),
    ("nike-therma-fit-hoodie", "Nike Therma FIT training pullover hoodie black swoosh front"),
    ("zara-knit-sweater-crew", "Zara knit crewneck pullover sweater light grey textured"),
    ("zara-straight-leg-jeans", "Zara vintage rigid straight leg denim jeans mid blue wash"),
    ("zara-quilted-bomber-jacket", "Zara water repellent quilted zip bomber jacket olive green"),
    ("zara-structured-tote-bag", "Zara minimalist structured tote shopper bag pebbled black"),
    ("gucci-bamboo-handle-bag", "Gucci Bamboo 1947 small top handle bag black curved bamboo"),
    ("boss-casual-slim-chino", "BOSS Schino slim stretch cotton twill chino trousers dark navy"),
    ("boss-oxford-slim-shirt", "BOSS Mabsoot slim fit structured oxford cotton button down shirt white"),
    ("boss-leather-chelsea-boot", "BOSS Kensington burnished black leather chelsea ankle boots"),
]

def main():
    target_slugs = {it[0] for it in DUP_TARGETS}
    
    # Load all hashes from other files
    global_hashes = set()
    for f in p.glob("*.webp"):
        if f.stem not in target_slugs:
            global_hashes.add(hashlib.md5(f.read_bytes()).hexdigest())

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(extra_http_headers={"Accept-Language": "en-US,en;q=0.9"})
        
        for slug, query in DUP_TARGETS:
            out_file = p / f"{slug}.webp"
            print(f"Resolving unique image for {slug}...", end=" ", flush=True)
            
            url = f"https://www.bing.com/images/search?q={urllib.parse.quote(query)}"
            page.goto(url)
            page.wait_for_timeout(300)
            
            imgs = page.locator("img.mimg").all()
            resolved = False
            for idx, img_el in enumerate(imgs):
                src = img_el.get_attribute("src") or img_el.get_attribute("data-src")
                if src and "th.bing.com/th/id/OIP" in src:
                    base = src.split("?")[0]
                    high_res = f"{base}?w=1000&h=1000&c=7&rs=1&p=0"
                    try:
                        req = urllib.request.Request(high_res, headers={"User-Agent": "Mozilla/5.0"})
                        data = urllib.request.urlopen(req, timeout=6).read()
                        if len(data) < 8000:
                            continue
                        h = hashlib.md5(data).hexdigest()
                        if h in global_hashes:
                            continue # Must be globally unique!
                        
                        pil_img = Image.open(io.BytesIO(data))
                        w, h_dim = pil_img.size
                        if w < 120 or h_dim < 120:
                            continue
                        
                        max_dim = max(w, h_dim)
                        sq = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
                        sq.paste(pil_img.convert("RGB"), ((max_dim - w) // 2, (max_dim - h_dim) // 2))
                        sq.resize((1000, 1000), Image.Resampling.LANCZOS).save(out_file, "WEBP", quality=92)
                        
                        final_h = hashlib.md5(out_file.read_bytes()).hexdigest()
                        global_hashes.add(final_h)
                        print(f"✅ OK (Thumbnail #{idx+1})")
                        resolved = True
                        break
                    except:
                        pass
            if not resolved:
                print("❌ FAIL")
            time.sleep(0.3)
            
        browser.close()

if __name__ == "__main__":
    main()
