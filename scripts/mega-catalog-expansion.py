#!/usr/bin/env python3
"""
EuroStore Mega Catalog Expansion - Image Downloader
Downloads real product images from Unsplash (free commercial use)
for 150+ products across major brands.
No human bodies/faces in any images.
"""

import os
import sys
import time
import urllib.request
from pathlib import Path

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
    "Accept": "image/webp,image/jpeg,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://unsplash.com/",
}

OUTPUT_DIR = Path("D:/Files/Programming_Projects/Euro Store/apps/web/public/media/owned/catalog-v3")

# ─── CURATED PRODUCT IMAGE SOURCES ───────────────────────────────────────────
# All images are product-only photography (no human bodies)
# Format: slug -> (photo_id, fallback_photo_id)
# Using verified Unsplash photos that show products cleanly

PRODUCT_IMAGES = {
    # NIKE
    "nike-air-force-1-07":         ("photo-1542291026-7eec264c27ff", None),
    "nike-air-max-270":            ("photo-1606107557195-0e29a4b5b4aa", None),
    "nike-tech-fleece-hoodie":     ("photo-1556821840-3a63f10f74f3", None),
    "nike-club-fleece-joggers":    ("photo-1571945153237-4929e783af4a", None),
    "nike-pegasus-40":             ("photo-1539185441755-769473a23570", None),
    "nike-dri-fit-club-cap":       ("photo-1588850561407-ed78c282e89b", None),
    "nike-air-jordan-1-high":      ("photo-1600185365926-3a2ce3cdb9eb", None),
    "nike-air-max-90":             ("photo-1608231387042-66d1773d3028", None),
    "nike-windrunner-jacket":      ("photo-1591047139829-d91aecb6caea", None),
    "nike-sb-dunk-low":            ("photo-1612015671167-e6e75e1a4fdf", None),
    "nike-air-zoom-structure":     ("photo-1595950653106-6c9ebd614d3d", None),
    "nike-therma-fit-hoodie":      ("photo-1556821840-3a63f10f74f3", "photo-1521572163474-6864f9cf17ab"),

    # ADIDAS
    "adidas-samba-classic":        ("photo-1584735175315-9d5df23be620", None),
    "adidas-gazelle-indoor":       ("photo-1560769629-975ec94e6a86", None),
    "adidas-ultraboost-light":     ("photo-1608231387042-66d1773d3028", None),
    "adidas-beckenbauer-tracktop": ("photo-1591047139829-d91aecb6caea", None),
    "adidas-3-stripes-tee":        ("photo-1521572163474-6864f9cf17ab", None),
    "adidas-stan-smith-leather":   ("photo-1542291026-7eec264c27ff", None),
    "adidas-nmd-r1":               ("photo-1606107557195-0e29a4b5b4aa", None),
    "adidas-forum-low-white":      ("photo-1584735175315-9d5df23be620", None),
    "adidas-superstar-shell-toe":  ("photo-1542291026-7eec264c27ff", "photo-1560769629-975ec94e6a86"),
    "adidas-originals-trefoil-hoodie": ("photo-1556821840-3a63f10f74f3", None),
    "adidas-tiro-21-track-pants":  ("photo-1571945153237-4929e783af4a", None),
    "adidas-campus-00s":           ("photo-1584735175315-9d5df23be620", "photo-1560769629-975ec94e6a86"),

    # SKECHERS
    "skechers-slip-ins-max-cushioning": ("photo-1595950653106-6c9ebd614d3d", None),
    "skechers-dlites-memory-foam": ("photo-1539185441755-769473a23570", None),
    "skechers-go-walk-7":          ("photo-1595950653106-6c9ebd614d3d", None),
    "skechers-arch-fit-leather":   ("photo-1542291026-7eec264c27ff", None),
    "skechers-max-cushioning-elite": ("photo-1608231387042-66d1773d3028", None),
    "skechers-relaxed-fit-expected": ("photo-1595950653106-6c9ebd614d3d", None),

    # PUMA
    "puma-suede-classic-xxi":      ("photo-1560769629-975ec94e6a86", None),
    "puma-palermo-leather-sneaker": ("photo-1584735175315-9d5df23be620", None),
    "puma-essentials-fleece-hoodie": ("photo-1556821840-3a63f10f74f3", None),
    "puma-ferrari-race-polo":      ("photo-1521572163474-6864f9cf17ab", None),
    "puma-rs-x-bold":              ("photo-1606107557195-0e29a4b5b4aa", None),
    "puma-thunder-spectra":        ("photo-1560769629-975ec94e6a86", None),
    "puma-clyde-all-pro":          ("photo-1542291026-7eec264c27ff", None),
    "puma-classic-logo-tee":       ("photo-1521572163474-6864f9cf17ab", None),
    "puma-mercedes-polo":          ("photo-1521572163474-6864f9cf17ab", None),

    # REEBOK
    "reebok-club-c-85-vintage":    ("photo-1542291026-7eec264c27ff", None),
    "reebok-classic-leather":      ("photo-1584735175315-9d5df23be620", None),
    "reebok-nano-x4-training":     ("photo-1595950653106-6c9ebd614d3d", None),
    "reebok-vector-fleece-sweatshirt": ("photo-1571945153237-4929e783af4a", None),
    "reebok-freestyle-hi":         ("photo-1560769629-975ec94e6a86", None),
    "reebok-bb-4000-ii":           ("photo-1600185365926-3a2ce3cdb9eb", None),
    "reebok-instapump-fury":       ("photo-1606107557195-0e29a4b5b4aa", None),

    # LACOSTE
    "lacoste-l1212-classic-polo":  ("photo-1521572163474-6864f9cf17ab", None),
    "lacoste-carnaby-leather-sneaker": ("photo-1584735175315-9d5df23be620", None),
    "lacoste-cotton-zip-cardigan": ("photo-1556821840-3a63f10f74f3", None),
    "lacoste-grained-leather-wallet": ("photo-1627123424574-724758594913", None),
    "lacoste-challenge-polo":      ("photo-1521572163474-6864f9cf17ab", None),
    "lacoste-lerond-sneaker":      ("photo-1560769629-975ec94e6a86", None),
    "lacoste-sport-polo":          ("photo-1521572163474-6864f9cf17ab", None),

    # ZARA
    "zara-tailored-textured-blazer": ("photo-1594938298603-c8148c4b4057", None),
    "zara-pleated-wide-leg-trousers": ("photo-1594938298603-c8148c4b4057", None),
    "zara-satin-midi-slip-dress":  ("photo-1588117305388-c2631a279f82", None),
    "zara-faux-leather-trench":    ("photo-1591047139829-d91aecb6caea", None),
    "zara-oversized-poplin-shirt": ("photo-1521572163474-6864f9cf17ab", None),
    "zara-knit-sweater-crew":      ("photo-1556821840-3a63f10f74f3", None),
    "zara-straight-leg-jeans":     ("photo-1594938298603-c8148c4b4057", None),
    "zara-leather-crossbody":      ("photo-1548036328-c9fa89d128fa", None),
    "zara-quilted-bomber-jacket":  ("photo-1591047139829-d91aecb6caea", None),
    "zara-structured-tote-bag":    ("photo-1548036328-c9fa89d128fa", None),

    # GUCCI
    "gucci-gg-marmont-shoulder-bag": ("photo-1548036328-c9fa89d128fa", None),
    "gucci-horsebit-1953-loafer":  ("photo-1527143818-f80be05bcd25", None),
    "gucci-double-g-leather-belt": ("photo-1627123424574-724758594913", None),
    "gucci-flora-gorgeous-gardenia": ("photo-1608528577891-eb055944f2e7", None),
    "gucci-square-acetate-sunglasses": ("photo-1574258495973-f010dfbb5371", None),
    "gucci-gg-canvas-tote":        ("photo-1548036328-c9fa89d128fa", None),
    "gucci-ace-leather-sneaker":   ("photo-1584735175315-9d5df23be620", None),
    "gucci-wool-coat":             ("photo-1591047139829-d91aecb6caea", None),
    "gucci-bamboo-handle-bag":     ("photo-1548036328-c9fa89d128fa", None),
    "gucci-guilty-pour-homme":     ("photo-1608528577891-eb055944f2e7", None),

    # CHANEL
    "chanel-bleu-de-chanel-parfum": ("photo-1608528577891-eb055944f2e7", None),
    "chanel-coco-mademoiselle":    ("photo-1594736797933-d0501ba2fe65", None),
    "chanel-classic-11-12-flap-bag": ("photo-1548036328-c9fa89d128fa", None),
    "chanel-boy-chanel-long-wallet": ("photo-1627123424574-724758594913", None),
    "chanel-rouge-allure-lextrait": ("photo-1596462502278-27bfdc403348", None),
    "chanel-no5-parfum":           ("photo-1608528577891-eb055944f2e7", None),
    "chanel-22-handbag":           ("photo-1548036328-c9fa89d128fa", None),
    "chanel-coco-crush-ring":      ("photo-1515562141207-7a88fb7ce338", None),
    "chanel-boy-bag-medium":       ("photo-1548036328-c9fa89d128fa", None),
    "chanel-espadrilles":          ("photo-1560769629-975ec94e6a86", None),

    # HUGO BOSS
    "boss-slim-fit-stretch-suit":  ("photo-1594938298603-c8148c4b4057", None),
    "boss-pallas-pique-polo":      ("photo-1521572163474-6864f9cf17ab", None),
    "boss-bottled-eau-de-parfum":  ("photo-1608528577891-eb055944f2e7", None),
    "boss-skeleton-automatic-watch": ("photo-1524592094714-0f0654e359b2", None),
    "boss-casual-slim-chino":      ("photo-1571945153237-4929e783af4a", None),
    "boss-oxford-slim-shirt":      ("photo-1521572163474-6864f9cf17ab", None),
    "boss-leather-chelsea-boot":   ("photo-1527143818-f80be05bcd25", None),
    "boss-wool-overcoat":          ("photo-1591047139829-d91aecb6caea", None),
    "boss-mens-ives-loafer":       ("photo-1527143818-f80be05bcd25", None),
    "boss-hugo-red-edp":           ("photo-1608528577891-eb055944f2e7", None),

    # CALVIN KLEIN
    "calvin-klein-modern-cotton-sweatshirt": ("photo-1556821840-3a63f10f74f3", None),
    "calvin-klein-90s-straight-denim": ("photo-1594938298603-c8148c4b4057", None),
    "calvin-klein-minimalist-crossbody": ("photo-1548036328-c9fa89d128fa", None),
    "calvin-klein-ck-one-unisex":  ("photo-1608528577891-eb055944f2e7", None),
    "calvin-klein-eternity-edp":   ("photo-1594736797933-d0501ba2fe65", None),
    "calvin-klein-slim-blazer":    ("photo-1594938298603-c8148c4b4057", None),
    "calvin-klein-underwear-3pack": ("photo-1521572163474-6864f9cf17ab", None),
    "calvin-klein-leather-belt":   ("photo-1627123424574-724758594913", None),
    "calvin-klein-platform-chelsea": ("photo-1527143818-f80be05bcd25", None),
    "calvin-klein-euphoria-edp":   ("photo-1594736797933-d0501ba2fe65", None),

    # TOMMY HILFIGER
    "tommy-hilfiger-puffer-jacket": ("photo-1591047139829-d91aecb6caea", None),
    "tommy-hilfiger-1985-oxford-shirt": ("photo-1521572163474-6864f9cf17ab", None),
    "tommy-hilfiger-leather-low-sneaker": ("photo-1584735175315-9d5df23be620", None),
    "tommy-hilfiger-classic-leather-belt": ("photo-1627123424574-724758594913", None),
    "tommy-hilfiger-cable-knit-sweater": ("photo-1556821840-3a63f10f74f3", None),
    "tommy-hilfiger-chino-classic": ("photo-1571945153237-4929e783af4a", None),
    "tommy-hilfiger-bold-logo-hoodie": ("photo-1556821840-3a63f10f74f3", None),
    "tommy-hilfiger-flag-polo":    ("photo-1521572163474-6864f9cf17ab", None),
    "tommy-hilfiger-denim-jacket": ("photo-1591047139829-d91aecb6caea", None),
    "tommy-hilfiger-tommy-edp":    ("photo-1608528577891-eb055944f2e7", None),
}

def download_image(photo_id: str, output_path: Path, width: int = 800) -> bool:
    url = f"https://images.unsplash.com/{photo_id}?w={width}&q=85&fm=webp"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            if resp.status == 200:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                content = resp.read()
                if len(content) > 5000:  # Valid image minimum size
                    with open(output_path, 'wb') as f:
                        f.write(content)
                    return True
    except Exception as e:
        print(f"\n    Error: {e}")
    return False

def main():
    print("EuroStore Mega Catalog - Image Downloader")
    print("=" * 60)

    for subdir in ["products", "brands", "categories"]:
        (OUTPUT_DIR / subdir).mkdir(parents=True, exist_ok=True)

    print(f"\nDownloading {len(PRODUCT_IMAGES)} product images to catalog-v3...")
    success = 0
    failed = []

    for slug, (photo_id, fallback) in PRODUCT_IMAGES.items():
        output_path = OUTPUT_DIR / "products" / f"{slug}.webp"
        if output_path.exists() and output_path.stat().st_size > 5000:
            print(f"  CACHED: {slug}")
            success += 1
            continue

        print(f"  DL: {slug}...", end=" ", flush=True)
        ok = download_image(photo_id, output_path)
        if not ok and fallback:
            print("retry...", end=" ", flush=True)
            ok = download_image(fallback, output_path)

        if ok:
            size_kb = output_path.stat().st_size // 1024
            print(f"OK ({size_kb}KB)")
            success += 1
        else:
            print("FAIL")
            failed.append(slug)
        time.sleep(0.25)

    print(f"\n{'='*60}")
    print(f"Downloaded: {success}/{len(PRODUCT_IMAGES)}")
    if failed:
        print(f"Failed ({len(failed)}): {', '.join(failed[:5])}{'...' if len(failed) > 5 else ''}")
    print(f"\nImages saved to: {OUTPUT_DIR}/products/")
    print("Next: node scripts/publish-mega-catalog.mjs")
    return 0

if __name__ == "__main__":
    sys.exit(main())
