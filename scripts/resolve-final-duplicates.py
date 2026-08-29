#!/usr/bin/env python3
"""
Targeted unique fetcher for the final 15 items to achieve 100% (186/186) unique studio photos.
"""

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

ITEMS_TO_DIFFERENTIATE = [
    ("adidas-adilette-comfort-slides", "Adidas Adilette Comfort slides black white cloudfoam product photo"),
    ("adidas-terrex-swift-r3", "Adidas Terrex Swift R3 GTX hiking shoe black product photo"),
    ("adidas-samba-classic", "Adidas Samba Classic indoor leather soccer shoe white black gum"),
    ("adidas-stan-smith-leather", "Adidas Stan Smith classic white green leather shoe side view"),
    ("adidas-forum-low-white", "Adidas Originals Forum Low white royal blue strap side view"),
    ("adidas-superstar-shell-toe", "Adidas Originals Superstar classic white black stripes shell toe"),
    ("adidas-tiro-21-track-pants", "Adidas Tiro 21 tapered track training pants black white stripes"),
    ("nike-therma-fit-hoodie", "Nike Therma-FIT training pullover hoodie dark black front view"),
    ("zara-knit-sweater-crew", "Zara grey melange ribbed crewneck knit sweater isolated"),
    ("zara-straight-leg-jeans", "Zara mid blue authentic vintage wash straight leg denim jeans"),
    ("zara-quilted-bomber-jacket", "Zara olive khaki green water-repellent zip quilted bomber jacket"),
    ("zara-structured-tote-bag", "Zara minimalist black pebbled leather structured tote shopper bag"),
    ("gucci-bamboo-handle-bag", "Gucci Bamboo 1947 small top handle bag black curved bamboo handle"),
    ("boss-casual-slim-chino", "BOSS Schino-Slim dark navy stretch cotton twill chino trousers"),
    ("boss-oxford-slim-shirt", "BOSS Mabsoot slim fit structured oxford cotton shirt optic white"),
    ("boss-leather-chelsea-boot", "BOSS Kensington burnished black leather elastic gusset chelsea boots"),
]

def main():
    # Load all existing hashes
    existing_hashes = set()
    for f in OUTPUT_DIR.glob("*.webp"):
        existing_hashes.add(hashlib.md5(f.read_bytes()).hexdigest())

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(extra_http_headers={"Accept-Language": "en-US,en;q=0.9"})
        
        for slug, q in ITEMS_TO_DIFFERENTIATE:
            out_path = OUTPUT_DIR / f"{slug}.webp"
            print(f"Fetching unique {slug}...", end=" ", flush=True)
            
            url = f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}"
            page.goto(url)
            page.wait_for_timeout(350)
            
            imgs = page.locator("img.mimg").all()
            found = False
            for im in imgs:
                src = im.get_attribute("src") or im.get_attribute("data-src")
                if src and "th.bing.com/th/id/OIP" in src:
                    base = src.split("?")[0]
                    high_res = f"{base}?w=1000&h=1000&c=7&rs=1&p=0"
                    try:
                        req = urllib.request.Request(high_res, headers={"User-Agent": "Mozilla/5.0"})
                        data = urllib.request.urlopen(req, timeout=6).read()
                        if len(data) < 8000:
                            continue
                        h = hashlib.md5(data).hexdigest()
                        if h in existing_hashes:
                            continue  # Keep looking for next unique thumbnail!
                        
                        pil_img = Image.open(io.BytesIO(data))
                        w, h_dim = pil_img.size
                        if w < 120 or h_dim < 120:
                            continue
                        
                        max_dim = max(w, h_dim)
                        sq = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
                        sq.paste(pil_img.convert("RGB"), ((max_dim - w) // 2, (max_dim - h_dim) // 2))
                        sq.resize((1000, 1000), Image.Resampling.LANCZOS).save(out_path, "WEBP", quality=92)
                        
                        new_h = hashlib.md5(out_path.read_bytes()).hexdigest()
                        existing_hashes.add(new_h)
                        print(f"✅ OK ({out_path.stat().st_size // 1024}KB)")
                        found = True
                        break
                    except:
                        pass
            if not found:
                print("❌ FAIL")
            time.sleep(0.3)
            
        browser.close()

if __name__ == "__main__":
    main()
