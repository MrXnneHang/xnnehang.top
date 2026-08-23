from io import BytesIO
from pathlib import Path
from shutil import copyfile
from PIL import Image

SOURCE = Path(r"C:\Users\Administrator\Desktop\image")
OUTPUT = Path(__file__).resolve().parents[1] / "src/assets/img/yandere-appearance"
MAX_BYTES = 1_000_000


def save_under_limit(source: Path, target: Path) -> tuple[int, tuple[int, int]]:
    with Image.open(source) as image:
        image = image.convert("RGB")
        low, high = 35, 95
        best = None
        while low <= high:
            quality = (low + high) // 2
            buffer = BytesIO()
            image.save(buffer, "JPEG", quality=quality, optimize=True, progressive=True)
            if buffer.tell() <= MAX_BYTES:
                best = (quality, buffer.getvalue())
                low = quality + 1
            else:
                high = quality - 1

        if best is None:
            raise ValueError(f"Cannot fit {source} under {MAX_BYTES} bytes")
        target.write_bytes(best[1])
        return best[0], image.size


INDICES = (0, 1, 2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 18)

OUTPUT.mkdir(parents=True, exist_ok=True)
for index in INDICES:
    original = SOURCE / "bj" / f"{index}.jpg"
    original_target = OUTPUT / f"{index:02d}-before.jpg"
    copyfile(original, original_target)
    with Image.open(original) as image:
        print(
            f"{index:02d} 原图: {image.width}x{image.height}, "
            f"original, {original_target.stat().st_size} bytes"
        )

    upscaled = SOURCE / "image" / f"{index}.png"
    upscaled_target = OUTPUT / f"{index:02d}-after.jpg"
    quality, size = save_under_limit(upscaled, upscaled_target)
    print(
        f"{index:02d} 超分图: {size[0]}x{size[1]}, "
        f"q={quality}, {upscaled_target.stat().st_size} bytes"
    )
