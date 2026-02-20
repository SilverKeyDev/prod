"""PDF image helpers: desaturate, contrast/brightness, resize for reportlab."""

from io import BytesIO

from PIL import Image as PILImage
from PIL import ImageEnhance
from reportlab.lib.units import inch
from reportlab.platypus import Image


def desaturate_image(img: PILImage.Image, saturation: float = 0.8) -> PILImage.Image:
    """Desaturate image. saturation=1.0 is original, 0.0 is grayscale, 0.8 is slightly desaturated."""
    enhancer = ImageEnhance.Color(img)
    return enhancer.enhance(saturation)


def adjust_contrast_and_brightness(
    img: PILImage.Image, contrast: float = 0.95, brightness: float = 0.95
) -> PILImage.Image:
    """Lower brightness and contrast slightly for moody/elegant feel."""
    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Brightness(img).enhance(brightness)
    return img


def enhance_image_for_pdf(pil_img: PILImage.Image) -> PILImage.Image:
    """Apply full image enhancement pipeline for elegant PDF appearance."""
    pil_img = desaturate_image(pil_img, 0.8)
    pil_img = adjust_contrast_and_brightness(pil_img, contrast=0.96, brightness=0.96)
    return pil_img


def resize_image_to_fit(
    img_data: BytesIO,
    target_width: float = 3.6 * inch,
    target_height: float = 2.0 * inch,
    is_chart: bool = False,
) -> Image:
    """Resize image to fit target dimensions; returns reportlab.platypus.Image."""
    pil_img = PILImage.open(img_data)
    if pil_img.mode not in ("RGB", "L"):
        pil_img = pil_img.convert("RGB")
    if not is_chart:
        pil_img = enhance_image_for_pdf(pil_img)
    width, height = pil_img.size
    aspect_ratio = width / height
    if aspect_ratio > 1:
        display_width = target_width
        display_height = target_width / aspect_ratio
    else:
        display_height = target_height
        display_width = target_height * aspect_ratio
    if not is_chart:
        min_width = 3.2 * inch
        min_height = 1.6 * inch
        display_width = max(display_width, min_width)
        display_height = max(display_height, min_height)
    else:
        min_chart_width = 2.5 * inch
        min_chart_height = 1.0 * inch
        display_width = max(display_width, min_chart_width)
        display_height = max(display_height, min_chart_height)
    enhanced_img_data = BytesIO()
    pil_img.save(enhanced_img_data, format="PNG")
    enhanced_img_data.seek(0)
    return Image(enhanced_img_data, width=display_width, height=display_height)


def resize_image_for_side_by_side(
    img_data: BytesIO,
    target_width: float = 2.5 * inch,
    target_height: float = 2.0 * inch,
    is_chart: bool = False,
) -> Image:
    """Resize image for side-by-side display."""
    pil_img = PILImage.open(img_data)
    if not is_chart:
        pil_img = enhance_image_for_pdf(pil_img)
    width, height = pil_img.size
    aspect_ratio = width / height
    if aspect_ratio > 1:
        display_width = target_width
        display_height = target_width / aspect_ratio
    else:
        display_height = target_height
        display_width = target_height * aspect_ratio
    min_width = 2.0 * inch
    min_height = 1.5 * inch
    display_width = max(display_width, min_width)
    display_height = max(display_height, min_height)
    enhanced_img_data = BytesIO()
    pil_img.save(enhanced_img_data, format="PNG")
    enhanced_img_data.seek(0)
    return Image(enhanced_img_data, width=display_width, height=display_height)


def resize_image_for_home_hero(
    img_data: BytesIO,
    target_width: float = 5.0 * inch,
    target_height: float = 3.5 * inch,
) -> Image:
    """Resize image for large home hero display."""
    pil_img = PILImage.open(img_data)
    width, height = pil_img.size
    aspect_ratio = width / height
    if aspect_ratio > 1:
        display_width = target_width
        display_height = target_width / aspect_ratio
    else:
        display_height = target_height
        display_width = target_height * aspect_ratio
    min_width = 4.0 * inch
    min_height = 2.5 * inch
    display_width = max(display_width, min_width)
    display_height = max(display_height, min_height)
    enhanced_img_data = BytesIO()
    pil_img.save(enhanced_img_data, format="PNG")
    enhanced_img_data.seek(0)
    return Image(enhanced_img_data, width=display_width, height=display_height)
