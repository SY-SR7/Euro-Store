from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont, ImageOps


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: create-media-contact-sheet.py INPUT_DIR OUTPUT_FILE")

    input_dir = Path(sys.argv[1]).resolve()
    output_file = Path(sys.argv[2]).resolve()
    supported = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
    ignored_parts = {".next", "node_modules", ".expo", "dist", "build"}
    files = sorted(
        path
        for path in input_dir.rglob("*")
        if path.suffix.lower() in supported and not ignored_parts.intersection(path.parts)
    )
    if not files:
        raise SystemExit(f"no images found in {input_dir}")

    columns = 4
    thumb_size = (320, 240)
    label_height = 58
    gap = 16
    rows = (len(files) + columns - 1) // columns
    width = gap + columns * (thumb_size[0] + gap)
    height = gap + rows * (thumb_size[1] + label_height + gap)
    sheet = Image.new("RGB", (width, height), "#f4f4f2")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=18)

    for index, path in enumerate(files):
        row, column = divmod(index, columns)
        x = gap + column * (thumb_size[0] + gap)
        y = gap + row * (thumb_size[1] + label_height + gap)
        with Image.open(path) as source:
            source.seek(0)
            tile = ImageOps.contain(source.convert("RGB"), thumb_size, Image.Resampling.LANCZOS)
        background = Image.new("RGB", thumb_size, "white")
        background.paste(tile, ((thumb_size[0] - tile.width) // 2, (thumb_size[1] - tile.height) // 2))
        sheet.paste(background, (x, y))
        label = f"{index + 1:02d}  {path.name}"
        draw.text((x, y + thumb_size[1] + 8), label[:42], fill="#111111", font=font)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_file, quality=92)
    print(f"created {output_file} with {len(files)} images")


if __name__ == "__main__":
    main()
