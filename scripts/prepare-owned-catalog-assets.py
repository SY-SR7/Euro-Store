from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "apps" / "web" / "public" / "media" / "owned"
BRAND_DIR = ASSET_ROOT / "brands"

BRANDS = [
    ("maison-aurelia", "MA", "MAISON AURELIA", "#5A1827", "#F7F2EA"),
    ("nordhavn-studio", "NS", "NORDHAVN STUDIO", "#183D34", "#F4F1E8"),
    ("cinder-and-vale", "CV", "CINDER & VALE", "#252525", "#D8B968"),
    ("velora-atelier", "VA", "VELORA ATELIER", "#4B3042", "#F6EEE8"),
    ("lumen-step", "LS", "LUMEN STEP", "#1F4A50", "#E8D28A"),
    ("little-loom", "LL", "LITTLE LOOM", "#C58A20", "#172A3A"),
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def create_brand_wordmarks() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    serif = font("C:/Windows/Fonts/georgiab.ttf", 180)
    sans = font("C:/Windows/Fonts/seguisb.ttf", 48)
    for slug, initials, name, background, foreground in BRANDS:
        image = Image.new("RGB", (1200, 800), background)
        draw = ImageDraw.Draw(image)
        initials_box = draw.textbbox((0, 0), initials, font=serif)
        initials_width = initials_box[2] - initials_box[0]
        draw.text(((1200 - initials_width) / 2, 180), initials, fill=foreground, font=serif)
        draw.line((380, 450, 820, 450), fill=foreground, width=3)
        name_box = draw.textbbox((0, 0), name, font=sans)
        name_width = name_box[2] - name_box[0]
        draw.text(((1200 - name_width) / 2, 505), name, fill=foreground, font=sans)
        image.save(BRAND_DIR / f"{slug}.png", optimize=True)


def create_webp_derivatives() -> None:
    for source in ASSET_ROOT.rglob("*.png"):
        target = source.with_suffix(".webp")
        with Image.open(source) as image:
            image.convert("RGB").save(target, "WEBP", quality=88, method=6)


if __name__ == "__main__":
    create_brand_wordmarks()
    create_webp_derivatives()
    print(f"prepared assets under {ASSET_ROOT}")
