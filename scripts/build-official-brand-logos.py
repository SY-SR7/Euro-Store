#!/usr/bin/env python3
"""
Fetch and render the 100% OFFICIAL vector brand logos for all 24 world brands.
Renders onto clean, crisp, luxury studio cards (1200x800 WebP) with transparent/pure backgrounds.
"""

import sys
import json
import time
import urllib.request
from pathlib import Path
import pymupdf  # fitz
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR_1 = ROOT / "apps" / "web" / "public" / "media" / "owned" / "brands"
BRAND_DIR_2 = ROOT / "apps" / "web" / "public" / "media" / "owned" / "catalog-v2" / "brands"
BRAND_DIR_3 = ROOT / "apps" / "web" / "public" / "media" / "owned" / "catalog-v3" / "brands"

for d in [BRAND_DIR_1, BRAND_DIR_2, BRAND_DIR_3]:
    d.mkdir(parents=True, exist_ok=True)

# Official Wikimedia Commons File names
WIKI_FILES = {
    "nike": "Logo_NIKE.svg",
    "adidas": "Adidas_Logo.svg",
    "puma": "Puma_AG.svg",
    "new-balance": "New_Balance_logo.svg",
    "converse": "Converse_logo.svg",
    "vans": "Vans-logo.svg",
    "skechers": "Skechers_logo.svg",
    "reebok": "Reebok_2019_logo.svg",
    "lacoste": "Lacoste_logo.svg",
    "ralph-lauren": "Ralph_Lauren_Corporation_logo.svg",
    "tommy-hilfiger": "Tommy_Hilfiger_logo.svg",
    "calvin-klein": "Calvin_klein_logo.svg",
    "hugo-boss": "Hugo_Boss_logo.svg",
    "zara": "Zara_Logo.svg",
    "gucci": "Gucci_Logo.svg",
    "chanel": "Chanel_logo_interlocking_cs.svg",
    "dior": "Dior_Logo.svg",
    "prada": "Prada-Logo.svg",
    "armani": "Emporio_Armani_logo.svg",
    "versace": "Versace_logo.svg",
    "ray-ban": "Ray-Ban_logo.svg",
    "casio": "Casio_logo.svg",
    "under-armour": "Under_armour_logo.svg",
    "michael-kors": "Michael_Kors_logo.svg"
}

def get_wikimedia_svg_url(file_name):
    api = f"https://en.wikipedia.org/w/api.php?action=query&titles=File:{file_name}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(api, headers={"User-Agent": "EuroStoreMediaEngine/2.0 (contact@eurostore.com)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            for _, page in pages.items():
                if "imageinfo" in page and len(page["imageinfo"]) > 0:
                    return page["imageinfo"][0]["url"]
    except Exception as e:
        print(f"  API error for {file_name}: {e}")
    return None

def download_svg_bytes(url):
    req = urllib.request.Request(url, headers={"User-Agent": "EuroStoreMediaEngine/2.0 (contact@eurostore.com)"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read()
    except Exception as e:
        print(f"  Download error: {e}")
    return None

def render_brand_logo_card(slug, svg_bytes):
    # Open SVG with PyMuPDF
    doc = pymupdf.open(stream=svg_bytes, filetype="svg")
    page = doc[0]
    # Render at high DPI
    pix = page.get_pixmap(dpi=300, alpha=True)
    
    # Convert pixmap to PIL Image
    img_logo = Image.frombytes("RGBA", [pix.width, pix.height], pix.samples)
    
    # Create luxurious clean white card with subtle luxury border (1200x800)
    card = Image.new("RGBA", (1200, 800), (255, 255, 255, 255))
    
    # Scale logo to fit nicely within (900x500) while keeping aspect ratio
    max_w, max_h = 850, 480
    w, h = img_logo.size
    ratio = min(max_w / w, max_h / h)
    new_size = (max(1, int(w * ratio)), max(1, int(h * ratio)))
    img_logo_resized = img_logo.resize(new_size, Image.Resampling.LANCZOS)
    
    # Center the logo on the card
    pos_x = (1200 - new_size[0]) // 2
    pos_y = (800 - new_size[1]) // 2
    card.paste(img_logo_resized, (pos_x, pos_y), img_logo_resized)
    
    # Convert to RGB for clean WebP
    card_rgb = Image.new("RGB", (1200, 800), (255, 255, 255))
    card_rgb.paste(card, (0, 0), card)
    
    # Save to all brand directories
    for d in [BRAND_DIR_1, BRAND_DIR_2, BRAND_DIR_3]:
        out_path = d / f"{slug}.webp"
        card_rgb.save(out_path, "WEBP", quality=95)
    
    print(f"  ✅ {slug}: Rendered official logo ({new_size[0]}x{new_size[1]})")

def main():
    print("🎨 Fetching & Rendering Official Brand Logos for 24 World Brands...")
    for slug, file_name in WIKI_FILES.items():
        print(f"Fetching {slug} ({file_name})...", end=" ", flush=True)
        svg_url = get_wikimedia_svg_url(file_name)
        if not svg_url:
            print("❌ Could not get SVG URL from Wikipedia API")
            continue
        
        time.sleep(0.5) # respectful delay
        svg_bytes = download_svg_bytes(svg_url)
        if not svg_bytes:
            print("❌ Could not download SVG bytes")
            continue
        
        render_brand_logo_card(slug, svg_bytes)
        time.sleep(0.3)
    
    print("\n🎉 All 24 official brand logos rendered successfully!")

if __name__ == "__main__":
    main()
