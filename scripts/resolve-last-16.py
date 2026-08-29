#!/usr/bin/env python3
import io
import hashlib
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

p = Path("D:/Files/Programming_Projects/Euro Store/apps/web/public/media/owned/catalog-v3/products")

items = [
    ("adidas-adilette-comfort-slides", "Adidas Adilette slides black white 3-stripes"),
    ("adidas-terrex-swift-r3", "Adidas Terrex Swift R3 GTX hiking shoe black"),
    ("adidas-samba-classic", "Adidas Samba Classic white black gum sole sneaker"),
    ("adidas-stan-smith-leather", "Adidas Stan Smith white green tennis sneaker"),
    ("adidas-forum-low-white", "Adidas Forum Low white royal blue strap sneaker"),
    ("adidas-superstar-shell-toe", "Adidas Superstar shell toe white black sneaker"),
    ("adidas-tiro-21-track-pants", "Adidas Tiro 21 track pants black white"),
    ("nike-therma-fit-hoodie", "Nike Therma-FIT training hoodie black swoosh"),
    ("zara-knit-sweater-crew", "Zara grey knitted crewneck sweater product"),
    ("zara-straight-leg-jeans", "Zara straight leg denim jeans blue product"),
    ("zara-quilted-bomber-jacket", "Zara olive green quilted bomber jacket product"),
    ("zara-structured-tote-bag", "Zara black structured tote bag product"),
    ("gucci-bamboo-handle-bag", "Gucci Bamboo 1947 top handle black leather bag"),
    ("boss-casual-slim-chino", "BOSS Schino slim fit navy chino pants"),
    ("boss-oxford-slim-shirt", "BOSS white oxford cotton dress shirt"),
    ("boss-leather-chelsea-boot", "BOSS black leather chelsea ankle boots"),
]

# Track existing hashes from other files
all_other_hashes = set()
for f in p.glob("*.webp"):
    if f.name not in [f"{it[0]}.webp" for it in items]:
        all_other_hashes.add(hashlib.md5(f.read_bytes()).hexdigest())

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(extra_http_headers={"Accept-Language": "en-US,en;q=0.9"})
    
    for slug, q in items:
        url = f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}"
        page.goto(url)
        page.wait_for_timeout(300)
        imgs = page.locator("img.mimg").all()
        for idx_img, im in enumerate(imgs):
            src = im.get_attribute("src") or im.get_attribute("data-src")
            if src and "th.bing.com/th/id/OIP" in src:
                base = src.split("?")[0]
                high_res = f"{base}?w=1000&h=1000&c=7&rs=1&p=0"
                try:
                    data = urllib.request.urlopen(urllib.request.Request(high_res, headers={"User-Agent": "Mozilla/5.0"}), timeout=6).read()
                    if len(data) < 8000:
                        continue
                    h = hashlib.md5(data).hexdigest()
                    if h in all_other_hashes:
                        continue # Skip to next thumbnail
                    
                    pil_img = Image.open(io.BytesIO(data))
                    w, h_dim = pil_img.size
                    if w < 120 or h_dim < 120:
                        continue
                    
                    max_dim = max(w, h_dim)
                    sq = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
                    sq.paste(pil_img.convert("RGB"), ((max_dim - w) // 2, (max_dim - h_dim) // 2))
                    sq.resize((1000, 1000), Image.Resampling.LANCZOS).save(p / f"{slug}.webp", "WEBP", quality=92)
                    
                    new_h = hashlib.md5((p / f"{slug}.webp").read_bytes()).hexdigest()
                    all_other_hashes.add(new_h)
                    print(f"✅ {slug} (img #{idx_img+1}): OK")
                    break
                except:
                    pass
    browser.close()
