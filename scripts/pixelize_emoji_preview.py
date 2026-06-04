#!/usr/bin/env python3
"""Downscale emoji to low-res then upscale with nearest-neighbor = pixelized look."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

EMOJI = "😀"
# 先渲染较大，再压到 N×N，最后整数倍放大
RENDER_PX = 72
PIXEL_GRID = 16
OUTPUT_PX = 128
BG = (13, 14, 21, 255)  # #0D0E15 app background

FONT_CANDIDATES = [
    "/System/Library/Fonts/Apple Color Emoji.ttc",
    "/System/Library/Fonts/Supplemental/Apple Color Emoji.ttc",
    "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf",
]


def load_emoji_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise RuntimeError("No emoji font found")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "assets" / "avatars-draft"
    out_dir.mkdir(parents=True, exist_ok=True)

    font = load_emoji_font(RENDER_PX - 8)
    base = Image.new("RGBA", (RENDER_PX, RENDER_PX), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)
    bbox = draw.textbbox((0, 0), EMOJI, font=font, embedded_color=True)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    ox = (RENDER_PX - tw) // 2 - bbox[0]
    oy = (RENDER_PX - th) // 2 - bbox[1]
    draw.text((ox, oy), EMOJI, font=font, embedded_color=True)

    # 像素化：低分辨率网格 + 最近邻放大
    tiny = base.resize((PIXEL_GRID, PIXEL_GRID), Image.Resampling.NEAREST)
    pixel = tiny.resize((OUTPUT_PX, OUTPUT_PX), Image.Resampling.NEAREST)

    # 带 App 背景色的预览（含 52px 格子示意）
    cell = 52
    preview = Image.new("RGBA", (cell + 40, cell + 40), BG)
    inset = Image.new("RGBA", (cell, cell), (26, 27, 38, 255))
    icon = pixel.resize((40, 40), Image.Resampling.NEAREST)
    preview.paste(icon, (10, 6), icon)
    preview.alpha_composite(inset, (20, 20))
    preview.paste(icon, (26, 26), icon)

    pixel_path = out_dir / "emoji-pixelized-sample.png"
    preview_path = out_dir / "emoji-pixelized-in-cell.png"

    # 纯像素图（透明底 + 黑底两版）
    on_black = Image.new("RGBA", (OUTPUT_PX, OUTPUT_PX), (0, 0, 0, 255))
    on_black.paste(pixel, (0, 0), pixel)
    on_black.save(pixel_path)

    preview.save(preview_path)

    print(f"Emoji: {EMOJI}")
    print(f"Grid: {PIXEL_GRID}x{PIXEL_GRID} -> {OUTPUT_PX}x{OUTPUT_PX}")
    print(f"Saved: {pixel_path}")
    print(f"Saved: {preview_path}")


if __name__ == "__main__":
    main()
