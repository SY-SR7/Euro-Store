#!/usr/bin/env python3
"""
Generate clean vector-like high-resolution brand logos (WebP 1200x800)
for all 24 world brands in EuroStore.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "apps" / "web" / "public" / "media" / "owned" / "brands"
CATALOG_V3_BRAND_DIR = ROOT / "apps" / "web" / "public" / "media" / "owned" / "catalog-v3" / "brands"

BRAND_DIR.mkdir(parents=True, exist_ok=True)
CATALOG_V3_BRAND_DIR.mkdir(parents=True, exist_ok=True)

# Brand specifications: (slug, name, font_family, font_size, bg_color, fg_color, subtitle, border_style)
BRANDS_SPEC = [
    # Existing 12 brands
    ("nike", "NIKE", "segoeuib.ttf", 150, "#111111", "#FFFFFF", "JUST DO IT", True),
    ("adidas", "ADIDAS", "georgiab.ttf", 140, "#000000", "#FFFFFF", "ORIGINALS", True),
    ("skechers", "SKECHERS", "segoeuib.ttf", 120, "#002B49", "#FFFFFF", "COMFORT INCLUDED", True),
    ("puma", "PUMA", "georgiab.ttf", 150, "#1A1A1A", "#FFFFFF", "FOREVER FASTER", True),
    ("reebok", "REEBOK", "segoeuib.ttf", 130, "#0F1A30", "#FFFFFF", "EST. 1895", True),
    ("lacoste", "LACOSTE", "georgiab.ttf", 130, "#004526", "#FFFFFF", "PARIS 1933", True),
    ("zara", "ZARA", "georgiab.ttf", 160, "#000000", "#FFFFFF", "MAN & WOMAN", True),
    ("gucci", "GUCCI", "georgiab.ttf", 150, "#1A1816", "#D4AF37", "FIRENZE 1921", True),
    ("chanel", "CHANEL", "georgiab.ttf", 150, "#111111", "#FFFFFF", "PARIS", True),
    ("hugo-boss", "BOSS", "segoeuib.ttf", 160, "#000000", "#FFFFFF", "HUGO BOSS", True),
    ("calvin-klein", "CALVIN KLEIN", "segoeuib.ttf", 100, "#1F1F1F", "#FFFFFF", "NEW YORK", True),
    ("tommy-hilfiger", "TOMMY HILFIGER", "segoeuib.ttf", 95, "#001740", "#FFFFFF", "EST. 1985", True),
    
    # 12 New World Brands
    ("new-balance", "NEW BALANCE", "segoeuib.ttf", 110, "#CE0E2D", "#FFFFFF", "BOSTON 1906", True),
    ("converse", "CONVERSE", "georgiab.ttf", 130, "#000000", "#FFFFFF", "ALL STAR", True),
    ("vans", "VANS", "segoeuib.ttf", 150, "#B71C1C", "#FFFFFF", "OFF THE WALL", True),
    ("ray-ban", "RAY-BAN", "georgiab.ttf", 140, "#C62828", "#FFFFFF", "GENUINE SINCE 1937", True),
    ("ralph-lauren", "POLO", "georgiab.ttf", 150, "#00205B", "#FFFFFF", "RALPH LAUREN", True),
    ("dior", "DIOR", "georgiab.ttf", 160, "#1A1A1A", "#F5E6C8", "PARIS", True),
    ("prada", "PRADA", "georgiab.ttf", 160, "#0A0A0A", "#FFFFFF", "MILANO 1913", True),
    ("armani", "EMPORIO ARMANI", "georgiab.ttf", 95, "#121212", "#E5D3B3", "MILANO", True),
    ("versace", "VERSACE", "georgiab.ttf", 140, "#000000", "#D4AF37", "MILANO", True),
    ("casio", "G-SHOCK", "segoeuib.ttf", 140, "#181818", "#E63946", "CASIO JAPAN", True),
    ("under-armour", "UNDER ARMOUR", "segoeuib.ttf", 95, "#1C1C1C", "#FFFFFF", "BALTIMORE", True),
    ("michael-kors", "MICHAEL KORS", "georgiab.ttf", 100, "#2B2620", "#DFB15B", "NEW YORK", True),
]

def render_logos():
    print("🎨 Generating 24 world brand logos (1200x800 WebP)...")
    for slug, name, font_name, size, bg, fg, sub, has_border in BRANDS_SPEC:
        img = Image.new("RGB", (1200, 800), bg)
        draw = ImageDraw.Draw(img)
        
        try:
            main_font = ImageFont.truetype(f"C:/Windows/Fonts/{font_name}", size)
        except:
            main_font = ImageFont.load_default()
            
        try:
            sub_font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 36)
        except:
            sub_font = ImageFont.load_default()

        # Elegant border frame
        if has_border:
            draw.rectangle([30, 30, 1170, 770], outline=fg, width=2)
            draw.rectangle([36, 36, 1164, 764], outline=fg, width=1)

        # Main Name Box
        bbox = draw.textbbox((0, 0), name, font=main_font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (1200 - w) / 2
        y = 300 - (h / 2)
        draw.text((x, y), name, fill=fg, font=main_font)

        # Divider Line
        draw.line([450, 470, 750, 470], fill=fg, width=2)

        # Subtitle
        s_bbox = draw.textbbox((0, 0), sub, font=sub_font)
        sw = s_bbox[2] - s_bbox[0]
        sx = (1200 - sw) / 2
        draw.text((sx, 510), sub, fill=fg, font=sub_font)

        # Save to both brand dirs
        out_webp1 = BRAND_DIR / f"{slug}.webp"
        out_webp2 = CATALOG_V3_BRAND_DIR / f"{slug}.webp"
        img.save(out_webp1, "WEBP", quality=92)
        img.save(out_webp2, "WEBP", quality=92)
        print(f"  ✅ Brand Logo: {slug}.webp")

if __name__ == "__main__":
    render_logos()
    print("Done!")
