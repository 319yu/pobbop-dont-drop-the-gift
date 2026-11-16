from pathlib import Path
from PIL import Image, ImageDraw


SOURCE = Path('/Users/huangyu/Desktop/0505516f-b5a3-48f9-a8c4-ae8798036287.png')
OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'boxes'

# Pixel-verified outer bounds of the three flat products in the supplied image.
# The crops intentionally exclude every background pixel beyond the rounded body.
BOXES = {
    'classic': (72, 245, 729, 537, 68),
    'mirror': (773, 245, 1414, 537, 68),
    'bouncy': (1455, 245, 2111, 541, 68),
}


def split() -> None:
    source = Image.open(SOURCE).convert('RGBA')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (left, top, right, bottom, radius) in BOXES.items():
        crop = source.crop((left, top, right, bottom))
        mask = Image.new('L', crop.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            (0, 0, crop.width - 1, crop.height - 1),
            radius=radius,
            fill=255,
        )
        crop.putalpha(mask)
        crop.save(OUTPUT / f'{name}.png', optimize=True)


if __name__ == '__main__':
    split()
