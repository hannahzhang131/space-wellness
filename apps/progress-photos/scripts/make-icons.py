"""Draw the Progress Pics icon: two photo cards, before and after. Re-run from apps/progress-photos."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "assets" / "images"
NIGHT = (11, 11, 11, 255)
BEFORE = (58, 56, 52, 255)
AFTER = (224, 82, 29, 255)
FIGURE_BEFORE = (122, 118, 110, 255)
FIGURE_AFTER = (255, 255, 255, 255)
SCALE = 4


def figure(draw: ImageDraw.ImageDraw, cx: float, top: float, height: float, shoulders: float, waist: float, fill) -> None:
    head = height * 0.2
    draw.ellipse((cx - head / 2, top, cx + head / 2, top + head), fill=fill)
    body_top = top + head * 1.22
    body_bottom = top + height
    waist_y = body_top + (body_bottom - body_top) * 0.55
    draw.polygon(
        [
            (cx - shoulders / 2, body_top + shoulders * 0.18),
            (cx + shoulders / 2, body_top + shoulders * 0.18),
            (cx + waist / 2, waist_y),
            (cx + waist / 2 * 0.9, body_bottom),
            (cx - waist / 2 * 0.9, body_bottom),
            (cx - waist / 2, waist_y),
        ],
        fill=fill,
    )
    radius = shoulders * 0.18
    draw.ellipse((cx - shoulders / 2, body_top, cx - shoulders / 2 + radius * 2, body_top + radius * 2), fill=fill)
    draw.ellipse((cx + shoulders / 2 - radius * 2, body_top, cx + shoulders / 2, body_top + radius * 2), fill=fill)
    draw.rectangle((cx - shoulders / 2 + radius, body_top, cx + shoulders / 2 - radius, body_top + radius * 2), fill=fill)


def draw_mark(size: int, background) -> Image.Image:
    big = size * SCALE
    image = Image.new("RGBA", (big, big), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    card_w = big * 0.335
    card_h = card_w * 4 / 3
    gap = big * 0.04
    left = (big - (card_w * 2 + gap)) / 2
    top = (big - card_h) / 2
    radius = card_w * 0.14
    cards = [
        (left, BEFORE, FIGURE_BEFORE, 0.6, 0.68),
        (left + card_w + gap, AFTER, FIGURE_AFTER, 0.64, 0.44),
    ]
    for x, card, person, shoulder_ratio, waist_ratio in cards:
        draw.rounded_rectangle((x, top, x + card_w, top + card_h), radius=radius, fill=card)
        figure_h = card_h * 0.72
        figure(
            draw,
            x + card_w / 2,
            top + card_h - figure_h,
            figure_h,
            card_w * shoulder_ratio,
            card_w * waist_ratio,
            person,
        )
    return image.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    icon = draw_mark(1024, NIGHT).convert("RGB")
    icon.save(ROOT / "icon.png")
    icon.resize((48, 48), Image.Resampling.LANCZOS).save(ROOT / "favicon.png")
    draw_mark(1024, None).save(ROOT / "splash-icon.png")
    draw_mark(1024, None).save(ROOT / "android-icon-foreground.png")
    Image.new("RGB", (1024, 1024), NIGHT[:3]).save(ROOT / "android-icon-background.png")
    draw_mark(1024, None).save(ROOT / "android-icon-monochrome.png")


if __name__ == "__main__":
    main()
