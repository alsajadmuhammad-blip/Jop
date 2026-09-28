from pathlib import Path

import fitz


source = Path("attached_assets/AL_SAJJAD_MOHAMMED(٢)_1790557591795.PDF")
output_dir = Path(".agents/outputs/alsajjad-pdf-pages")
output_dir.mkdir(parents=True, exist_ok=True)

document = fitz.open(source)
print(f"pages={document.page_count}")
print(f"metadata={document.metadata}")

for index, page in enumerate(document):
    image_path = output_dir / f"page-{index + 1}.png"
    pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    pixmap.save(image_path)
    blocks = page.get_text("dict")["blocks"]
    text_blocks = [block for block in blocks if block.get("type") == 0]
    print(f"page={index + 1} size={page.rect.width:.0f}x{page.rect.height:.0f} text_blocks={len(text_blocks)} image={image_path}")