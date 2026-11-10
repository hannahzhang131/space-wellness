"""Draw the RentProof icon set. Re-run from apps/deposit-proof."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "assets" / "images"
PAPER = (230, 224, 212, 255)
SEAL = (143, 45, 42, 255)
FONT = Path("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf")
if not FONT.exists():
    FONT = Path("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf")


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT), size)


def draw_mark(size: int, ink: tuple[int, int, int, int], background: tuple[int, int, int, int] | None) -> Image.Image:
    image = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    margin = int(size * 0.16)
    box = [margin, margin, size - margin, size - margin]
    ring = max(4, size // 48)
    draw.ellipse(box, outline=ink, width=ring)
    gap = ring * 3
    inner = [box[0] + gap, box[1] + gap, box[2] - gap, box[3] - gap]
    draw.ellipse(inner, outline=ink, width=max(2, ring // 2))
    draw.text((size / 2, size / 2 - size * 0.02), "RP", font=font(int(size * 0.28)), fill=ink, anchor="mm")
    return image


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    icon = draw_mark(1024, SEAL, PAPER)
    icon.save(ROOT / "icon.png")
    icon.resize((48, 48), Image.Resampling.LANCZOS).save(ROOT / "favicon.png")
    draw_mark(1024, SEAL, None).save(ROOT / "splash-icon.png")
    draw_mark(1024, SEAL, None).save(ROOT / "android-icon-foreground.png")
    Image.new("RGBA", (1024, 1024), PAPER).save(ROOT / "android-icon-background.png")
    draw_mark(1024, (255, 255, 255, 255), None).save(ROOT / "android-icon-monochrome.png")


if __name__ == "__main__":
    main()
