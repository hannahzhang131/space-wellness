"""Draw the RentProof icon: black field, the name in two lines. Re-run from apps/deposit-proof."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "assets" / "images"
BLACK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)
LINES = ("Rent", "Proof")
FONT = Path("/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf")
if not FONT.exists():
    FONT = Path("/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf")


def load_font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT), size)


def line_width(face: ImageFont.FreeTypeFont, text: str, tracking: float) -> float:
    return sum(face.getlength(char) for char in text) + tracking * (len(text) - 1)


def draw_line(
    draw: ImageDraw.ImageDraw,
    text: str,
    face: ImageFont.FreeTypeFont,
    top: float,
    canvas: int,
    fill: tuple[int, int, int, int],
    tracking: float,
) -> None:
    x = (canvas - line_width(face, text, tracking)) / 2
    for char in text:
        draw.text((x, top), char, font=face, fill=fill)
        x += face.getlength(char) + tracking


def draw_wordmark(
    size: int,
    fill: tuple[int, int, int, int],
    background: tuple[int, int, int, int] | None,
    max_width_ratio: float,
) -> Image.Image:
    image = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    # Android's circle mask and iOS's rounded corners both eat the corners.
    # Keep the longer word inside the center so "Proof" is not clipped.
    target = size * max_width_ratio
    font_size = int(size * 0.22)
    face = load_font(font_size)
    tracking = font_size * 0.04
    widest = max(line_width(face, line, tracking) for line in LINES)
    if widest > target:
        font_size = max(8, int(font_size * target / widest))
        face = load_font(font_size)
        tracking = font_size * 0.04
    ascent, descent = face.getmetrics()
    line_height = ascent + descent
    gap = int(font_size * 0.16)
    block = line_height * 2 + gap
    top = (size - block) / 2
    for line in LINES:
        draw_line(draw, line, face, top, size, fill, tracking)
        top += line_height + gap
    return image


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    icon = draw_wordmark(1024, WHITE, BLACK, 0.62).convert("RGB")
    icon.save(ROOT / "icon.png")
    icon.resize((48, 48), Image.Resampling.LANCZOS).save(ROOT / "favicon.png")
    # Splash and Android foreground sit on a black field set in app.json.
    draw_wordmark(1024, WHITE, None, 0.62).save(ROOT / "splash-icon.png")
    draw_wordmark(1024, WHITE, None, 0.62).save(ROOT / "android-icon-foreground.png")
    Image.new("RGB", (1024, 1024), (0, 0, 0)).save(ROOT / "android-icon-background.png")
    draw_wordmark(1024, WHITE, None, 0.62).save(ROOT / "android-icon-monochrome.png")


if __name__ == "__main__":
    main()
