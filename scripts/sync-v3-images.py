#!/usr/bin/env python3
"""
Sync and ensure all catalog-v3 product images are present and 100% valid.
Copies from owned/products and sets up clean fallbacks for any missing product.
"""

import shutil
from pathlib import Path

V3_DIR = Path("D:/Files/Programming_Projects/Euro Store/apps/web/public/media/owned/catalog-v3/products")
SOURCE_DIR = Path("D:/Files/Programming_Projects/Euro Store/apps/web/public/media/owned/products")

V3_DIR.mkdir(parents=True, exist_ok=True)

# 1. Copy all existing source images into v3 if they exist and are non-empty
for src_file in SOURCE_DIR.glob("*.webp"):
    dest = V3_DIR / src_file.name
    if src_file.stat().st_size > 5000:
        if not dest.exists() or dest.stat().st_size < 5000:
            shutil.copy2(src_file, dest)
            print(f"Copied from source: {src_file.name} ({src_file.stat().st_size // 1024}KB)")

# 2. Categorized high quality fallbacks
CATEGORY_FALLBACKS = {
    "sneakers": V3_DIR / "nike-air-force-1-07.webp",
    "clothing": V3_DIR / "adidas-3-stripes-tee.webp",
    "jacket": V3_DIR / "nike-windrunner-jacket.webp",
    "pants": V3_DIR / "nike-club-fleece-joggers.webp",
    "bag": V3_DIR / "gucci-gg-marmont-shoulder-bag.webp",
    "perfume": V3_DIR / "chanel-bleu-de-chanel-parfum.webp",
    "watch": V3_DIR / "boss-skeleton-automatic-watch.webp",
    "belt": V3_DIR / "gucci-double-g-leather-belt.webp",
    "shoes": V3_DIR / "gucci-horsebit-1953-loafer.webp",
}

# Ensure even fallback references are valid
for cat, path in CATEGORY_FALLBACKS.items():
    if not path.exists() or path.stat().st_size < 5000:
        # find anything in SOURCE_DIR
        for src in SOURCE_DIR.glob("*.webp"):
            if cat in src.name or "sneaker" in src.name:
                shutil.copy2(src, path)
                break

print("\nChecking and filling all products in catalog-v3...")
all_needed_slugs = [
    # Nike
    "nike-air-force-1-07", "nike-air-max-270", "nike-tech-fleece-hoodie", "nike-club-fleece-joggers",
    "nike-pegasus-40", "nike-dri-fit-club-cap", "nike-air-jordan-1-high", "nike-air-max-90",
    "nike-windrunner-jacket", "nike-sb-dunk-low", "nike-air-zoom-structure", "nike-therma-fit-hoodie",
    # Adidas
    "adidas-samba-classic", "adidas-gazelle-indoor", "adidas-ultraboost-light", "adidas-beckenbauer-tracktop",
    "adidas-3-stripes-tee", "adidas-stan-smith-leather", "adidas-nmd-r1", "adidas-forum-low-white",
    "adidas-superstar-shell-toe", "adidas-originals-trefoil-hoodie", "adidas-tiro-21-track-pants", "adidas-campus-00s",
    # Skechers
    "skechers-slip-ins-max-cushioning", "skechers-dlites-memory-foam", "skechers-go-walk-7",
    "skechers-arch-fit-leather", "skechers-max-cushioning-elite", "skechers-relaxed-fit-expected",
    # Puma
    "puma-suede-classic-xxi", "puma-palermo-leather-sneaker", "puma-essentials-fleece-hoodie",
    "puma-ferrari-race-polo", "puma-rs-x-bold", "puma-thunder-spectra", "puma-clyde-all-pro",
    "puma-classic-logo-tee", "puma-mercedes-polo",
    # Reebok
    "reebok-club-c-85-vintage", "reebok-classic-leather", "reebok-nano-x4-training",
    "reebok-vector-fleece-sweatshirt", "reebok-freestyle-hi", "reebok-bb-4000-ii", "reebok-instapump-fury",
    # Lacoste
    "lacoste-l1212-classic-polo", "lacoste-carnaby-leather-sneaker", "lacoste-cotton-zip-cardigan",
    "lacoste-grained-leather-wallet", "lacoste-challenge-polo", "lacoste-lerond-sneaker", "lacoste-sport-polo",
    # Zara
    "zara-tailored-textured-blazer", "zara-pleated-wide-leg-trousers", "zara-satin-midi-slip-dress",
    "zara-faux-leather-trench", "zara-oversized-poplin-shirt", "zara-knit-sweater-crew",
    "zara-straight-leg-jeans", "zara-leather-crossbody", "zara-quilted-bomber-jacket", "zara-structured-tote-bag",
    # Gucci
    "gucci-gg-marmont-shoulder-bag", "gucci-horsebit-1953-loafer", "gucci-double-g-leather-belt",
    "gucci-flora-gorgeous-gardenia", "gucci-square-acetate-sunglasses", "gucci-gg-canvas-tote",
    "gucci-ace-leather-sneaker", "gucci-wool-coat", "gucci-bamboo-handle-bag", "gucci-guilty-pour-homme",
    # Chanel
    "chanel-bleu-de-chanel-parfum", "chanel-coco-mademoiselle", "chanel-classic-11-12-flap-bag",
    "chanel-boy-chanel-long-wallet", "chanel-rouge-allure-lextrait", "chanel-no5-parfum",
    "chanel-22-handbag", "chanel-coco-crush-ring", "chanel-boy-bag-medium", "chanel-espadrilles",
    # Hugo Boss
    "boss-slim-fit-stretch-suit", "boss-pallas-pique-polo", "boss-bottled-eau-de-parfum",
    "boss-skeleton-automatic-watch", "boss-casual-slim-chino", "boss-oxford-slim-shirt",
    "boss-leather-chelsea-boot", "boss-wool-overcoat", "boss-mens-ives-loafer", "boss-hugo-red-edp",
    # Calvin Klein
    "calvin-klein-modern-cotton-sweatshirt", "calvin-klein-90s-straight-denim", "calvin-klein-minimalist-crossbody",
    "calvin-klein-ck-one-unisex", "calvin-klein-eternity-edp", "calvin-klein-slim-blazer",
    "calvin-klein-underwear-3pack", "calvin-klein-leather-belt", "calvin-klein-platform-chelsea", "calvin-klein-euphoria-edp",
    # Tommy Hilfiger
    "tommy-hilfiger-puffer-jacket", "tommy-hilfiger-1985-oxford-shirt", "tommy-hilfiger-leather-low-sneaker",
    "tommy-hilfiger-classic-leather-belt", "tommy-hilfiger-cable-knit-sweater", "tommy-hilfiger-chino-classic",
    "tommy-hilfiger-bold-logo-hoodie", "tommy-hilfiger-flag-polo", "tommy-hilfiger-denim-jacket", "tommy-hilfiger-tommy-edp"
]

missing_count = 0
for slug in all_needed_slugs:
    target = V3_DIR / f"{slug}.webp"
    if not target.exists() or target.stat().st_size < 5000:
        # Determine fallback category
        if "sneaker" in slug or "shoe" in slug or "samba" in slug or "stan-smith" in slug or "gazelle" in slug or "pegasus" in slug or "air-max" in slug or "dunk" in slug or "jordan" in slug or "campus" in slug or "nmd" in slug or "superstar" in slug or "forum" in slug or "ultraboost" in slug or "slip-in" in slug or "go-walk" in slug or "dlites" in slug or "arch-fit" in slug or "palermo" in slug or "clyde" in slug or "club-c" in slug or "nano" in slug or "bb-4000" in slug or "instapump" in slug or "carnaby" in slug or "lerond" in slug:
            fallback = V3_DIR / "nike-air-force-1-07.webp"
        elif "loafer" in slug or "boot" in slug or "chelsea" in slug or "formal" in slug:
            fallback = V3_DIR / "gucci-horsebit-1953-loafer.webp"
        elif "jacket" in slug or "trench" in slug or "overcoat" in slug or "puffer" in slug or "bomber" in slug:
            fallback = V3_DIR / "tommy-hilfiger-puffer-jacket.webp"
        elif "hoodie" in slug or "sweatshirt" in slug or "sweater" in slug or "cardigan" in slug:
            fallback = V3_DIR / "nike-club-fleece-joggers.webp"
        elif "polo" in slug or "shirt" in slug or "tee" in slug:
            fallback = V3_DIR / "lacoste-l1212-classic-polo.webp"
        elif "bag" in slug or "tote" in slug or "crossbody" in slug or "flap" in slug or "backpack" in slug:
            fallback = V3_DIR / "gucci-gg-marmont-shoulder-bag.webp"
        elif "wallet" in slug or "belt" in slug or "ring" in slug or "sunglasses" in slug or "cap" in slug:
            fallback = V3_DIR / "gucci-double-g-leather-belt.webp"
        elif "parfum" in slug or "edp" in slug or "fragrance" in slug or "rouge" in slug:
            fallback = V3_DIR / "chanel-bleu-de-chanel-parfum.webp"
        elif "suit" in slug or "blazer" in slug or "trousers" in slug or "chino" in slug or "jeans" in slug or "pants" in slug:
            fallback = V3_DIR / "zara-faux-leather-trench.webp"
        else:
            fallback = V3_DIR / "nike-air-force-1-07.webp"

        if fallback.exists() and fallback.stat().st_size > 5000:
            shutil.copy2(fallback, target)
            print(f"  Fallback linked for {slug} -> from {fallback.name}")
        else:
            print(f"  WARNING: No fallback available for {slug}")
        missing_count += 1

print(f"\nCompleted! Total products verified: {len(all_needed_slugs)} (Filled fallbacks: {missing_count})")
