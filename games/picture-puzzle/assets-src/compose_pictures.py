"""Composes the puzzle pictures from the CC0 sources in this folder.

Each picture is one Kenney animal, large and centred, on a Kenney background,
saved as ../assets/pictures/<id>.png at 1024 x 768 (4:3, so every level's grid
cuts it into near-square pieces).

Sources (CC0, see the License.txt files and ../CREDITS.md):
- backgrounds/: Kenney "Background Elements Redux".
- animals/<name>.png: Kenney "Animal Pack Redux", roundOutline.svg rendered at
  4x in Chromium and cropped, so the animals stay sharp at puzzle size.

Run with any Python that has Pillow:  python compose_pictures.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "assets" / "pictures"
SIZE = (1024, 768)

# id: (background, animal height as a share of the picture)
PICTURES = {
    "dog": ("backgroundColorGrass.png", 0.62),
    "rabbit": ("backgroundColorForest.png", 0.66),
    "elephant": ("backgroundColorDesert.png", 0.58),
    "bear": ("backgroundColorFall.png", 0.58),
    "pig": ("backgroundCastles.png", 0.58),
}


def compose(picture_id: str, background: str, share: float) -> Image.Image:
    # The square background keeps its lower part: scenery and ground.
    scene = Image.open(HERE / "backgrounds" / background).convert("RGBA")
    scene = scene.crop((0, scene.height - SIZE[1], SIZE[0], scene.height))

    animal = Image.open(HERE / "animals" / f"{picture_id}.png").convert("RGBA")
    height = int(SIZE[1] * share)
    width = int(animal.width * height / animal.height)
    animal = animal.resize((width, height), Image.LANCZOS)
    x = (SIZE[0] - width) // 2
    y = int(SIZE[1] * 0.9) - height

    # A soft shadow on the ground under the animal.
    shadow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse(
        (x + width * 0.12, y + height - 26, x + width * 0.88, y + height + 22),
        fill=(0, 0, 0, 70),
    )
    scene.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12)))
    scene.alpha_composite(animal, (x, y))
    return scene.convert("RGB")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for picture_id, (background, share) in PICTURES.items():
        path = OUT / f"{picture_id}.png"
        compose(picture_id, background, share).save(path, optimize=True)
        print(f"{path.relative_to(HERE.parent)}")
