from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    HRFlowable,
    Indenter
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER
import os
import requests
from io import BytesIO
import logging
import traceback
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from app.services.s3_service import s3_service
from urllib.parse import quote_plus
from .graphic_generation import generate_horizontal_bar_chart, generate_vertical_lollipop_chart, generate_commute_map
from PIL import Image as PILImage, ImageEnhance

SERP_API_KEY = os.getenv("SERP_API")
SERP_API_ENDPOINT = "https://serpapi.com/search.json"

logger = logging.getLogger(__name__)

def _desaturate_image(img: PILImage.Image, saturation=0.8) -> PILImage.Image:
    """
    Desaturate image for a more elegant, muted appearance.
    saturation=1.0 is original, 0.0 is grayscale, 0.8 is slightly desaturated.
    """
    enhancer = ImageEnhance.Color(img)
    return enhancer.enhance(saturation)

def _adjust_contrast_and_brightness(img: PILImage.Image, contrast=0.95, brightness=0.95) -> PILImage.Image:
    """
    Lower brightness and contrast slightly for moody/elegant feel.
    Values < 1.0 reduce the effect, values > 1.0 increase it.
    """
    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Brightness(img).enhance(brightness)
    return img

def _enhance_image_for_pdf(pil_img: PILImage.Image) -> PILImage.Image:
    """
    Apply the complete image enhancement pipeline for elegant PDF appearance.
    This makes images softer, more integrated, and less flashy while still attractive.
    """
    # Apply desaturation first
    pil_img = _desaturate_image(pil_img, 0.8)
    # Then adjust contrast and brightness
    pil_img = _adjust_contrast_and_brightness(pil_img, contrast=0.96, brightness=0.96)
    return pil_img

def _create_pdf(report: dict, address: str, filename: str, comparison_address: str = None, user_preferences: dict = None) -> str:
    if not report:
        logger.error("No report data provided")
        raise ValueError("Report data is required")
    if not address:
        logger.error("No address provided")
        raise ValueError("Address is required")
    
    logger.info(f"📄 Starting PDF creation for address: {address}")
    logger.info(f"📊 Report sections available: {list(report.keys())}")
    logger.debug(f"🔍 Full report data: {report}")

    try:
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=30,
            topMargin=40,
            bottomMargin=40,
            title=f"SilverKey: {address}"
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name="MainTitleComparison", fontSize=18, leading=30, fontName="Helvetica", textColor=colors.black, alignment=TA_CENTER, wordWrap='LTR', splitLongWords=False))
        styles.add(ParagraphStyle(name="MainTitle", fontSize=22, leading=30, fontName="Helvetica", textColor=colors.black, alignment=TA_CENTER, wordWrap='LTR', splitLongWords=False))
        styles.add(ParagraphStyle(name="SectionHeader", fontSize=18, leading=22, textColor=colors.black, fontName="Helvetica", spaceAfter=8))
        styles.add(ParagraphStyle(name="SectionSubHeader", fontSize=16, leading=20, textColor="#D8CAB8", fontName="Helvetica-Bold", spaceAfter=8))
        styles.add(ParagraphStyle(name="SubHeader", fontSize=11, leading=14, textColor="#6A7B52", fontName="Helvetica-Oblique", spaceAfter=6))
        styles.add(ParagraphStyle(name="Body", fontSize=10, leading=13, fontName="Helvetica", spaceAfter=4))
        styles.add(ParagraphStyle(name="Caption", fontSize=8, leading=10, textColor=colors.grey, alignment=TA_CENTER, fontName="Helvetica-Oblique"))
        styles.add(ParagraphStyle(name="HighlightBox", fontSize=10, backColor="#f6f6f6", borderPadding=4, borderColor="#6A7B52", borderWidth=1, borderRadius=4, leading=12, spaceAfter=6, fontName="Helvetica"))

        elements = []

        # Add main title with address (different for comparison reports)
        if comparison_address and comparison_address.strip():
            title = f"{address} vs"
            logger.info(f"📊 Creating comparison report title: {title}")
            elements.append(Paragraph(title, styles["MainTitleComparison"]))
            elements.append(Spacer(1, 1))
            elements.append(Paragraph(comparison_address, styles["MainTitleComparison"]))
            elements.append(Spacer(1, 1))
            elements.append(HRFlowable(width="100%", thickness=1.2, color="#D8CAB8"))
            elements.append(Spacer(1, 20))
            
            # Add property headers for comparison
            property_table = Table([[
                Paragraph(f"Property A: <font color='black'>{address}</font>", styles["SubHeader"]),
                Paragraph(f"Property B: <font color='black'>{comparison_address}</font>", styles["SubHeader"])
            ]], colWidths=[doc.width/2.0-15, doc.width/2.0-15])
            property_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            elements.append(property_table)
            elements.append(Spacer(1, 10))
        else:
            title = address
            logger.info(f"📊 Creating regular report title: {title}")
            elements.append(Paragraph(title, styles["MainTitle"]))
            elements.append(Spacer(1, 1))
            elements.append(HRFlowable(width="100%", thickness=1.2, color="#D8CAB8"))
            elements.append(Spacer(1, 20))

        
       

        # Cache chart tables for side-by-side rendering
        chart_tables = {}  # Cache for deferred rendering

        for i, (section, section_data) in enumerate(report.items()):
            logger.info(f"🔄 Processing section {i+1}/{len(report)}: '{section}'")
            key = section.replace("_", " ").title()

            # Special styling for property_data section (no title)
            if section.lower() == "property_data":
                # Add spacing without title for cleaner look
                elements.append(Spacer(1, 10))
            # Skip title for chart sections
            elif i != 0 and section.lower() not in ["age_distribution", "lifestyle_dna"]:
                elements.append(Paragraph(key, styles["SectionHeader"]))
                elements.append(HRFlowable(width="100%", thickness=0.5, color="#AAAAAA"))
                elements.append(Spacer(1, 1))

            # CHART SECTION: Generate and cache for later rendering
            if section.lower() in ["age_distribution", "lifestyle_dna"] and isinstance(section_data, dict):
                logger.info(f"📊 Processing chart section: {section}")
                logger.info(f"📊 Chart data received: {section_data}")
                
                chart_data = {}

                if section.lower() == "lifestyle_dna":
                    logger.info("📊 Processing lifestyle_dna chart...")
                    for k, v in section_data.items():
                        # Handle values that are already percentages or numbers
                        if isinstance(v, str) and v.endswith('%'):
                            chart_data[k] = v
                        else:
                            chart_data[k] = f"{v}%"
                    logger.info(f"📊 Lifestyle DNA chart data prepared: {chart_data}")
                    chart_buffer = generate_horizontal_bar_chart(chart_data, key)
                    logger.info(f"📊 Lifestyle DNA chart buffer result: {chart_buffer is not None}")

                elif section.lower() == "age_distribution":
                    logger.info("📊 Processing age_distribution chart...")
                    for field_name, value in section_data.items():
                        if field_name.startswith("age_"):
                            display_name = field_name.replace("age_", "").replace("_plus", "+").replace("_", "-")
                        else:
                            display_name = field_name
                        
                        # Handle values that already have % suffix
                        if isinstance(value, str) and value.endswith('%'):
                            chart_data[display_name] = value
                        else:
                            chart_data[display_name] = f"{value}%"
                    logger.info(f"📊 Age distribution chart data prepared: {chart_data}")
                    chart_buffer = generate_vertical_lollipop_chart(chart_data, key)
                    logger.info(f"📊 Age distribution chart buffer result: {chart_buffer is not None}")

                # Only cache if chart rendered successfully
                if chart_buffer:
                    logger.info(f"📊 Creating chart table for {section}")
                    img = _resize_image_to_fit(chart_buffer, target_width=3.6 * inch, target_height=2.8 * inch, is_chart=True)
                    table = Table([[img]], colWidths=[3.6 * inch])
                    table.setStyle(TableStyle([
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 10),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                        ("TOPPADDING", (0, 0), (-1, -1), 1),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                    ]))
                    chart_tables[section.lower()] = table
                    logger.info(f"📊 Chart table cached for {section}. Total cached: {len(chart_tables)}")
                else:
                    logger.error(f"❌ Chart generation failed for {section} - chart_buffer is None")

                continue  # Skip rest of loop for chart sections

            if isinstance(section_data, dict):
                logger.info(f"📝 Processing {section} as nested dictionary")
                
                # Special aesthetic handling for property_data section
                if section.lower() == "property_data":
                    _add_property_data_section(elements, section_data, styles)
                    continue
                
                # Generate commute map for commute section
                elif section.lower() == "commute":
                    try:
                        # Get Google Maps API key from environment
                        google_maps_api_key = os.getenv('GOOGLE_MAPS_API_KEY')
                        if google_maps_api_key and user_preferences:
                            # Generate commute map using primary address and important locations
                            commute_map_result = generate_commute_map(address, user_preferences, google_maps_api_key)
                            if commute_map_result:
                                # Handle new return format with map buffer and travel times
                                if isinstance(commute_map_result, dict):
                                    map_buffer = commute_map_result.get('map_buffer')
                                    travel_times = commute_map_result.get('travel_times', [])
                                else:
                                    # Backward compatibility - assume it's just the buffer
                                    map_buffer = commute_map_result
                                    travel_times = []
                                
                                # Add map image to PDF
                                if map_buffer:
                                    try:
                                        map_image = _resize_image_to_fit(map_buffer, target_width=5.0 * inch, target_height=3.5 * inch)
                                        if map_image:
                                            elements.append(Spacer(1, 10))
                                            elements.append(map_image)
                                            elements.append(Paragraph("Commute Routes to Important Locations", styles["Caption"]))
                                            elements.append(Spacer(1, 6))
                                            logger.info("✅ Commute map added to PDF successfully")
                                        else:
                                            logger.warning("⚠️ Failed to resize commute map image")
                                    except Exception as resize_error:
                                        logger.error(f"❌ Error resizing commute map: {str(resize_error)}")
                                
                                # Add travel times as bulleted list
                                if travel_times:
                                    logger.info(f"📝 Adding {len(travel_times)} travel times to PDF as bulleted list")
                                    elements.append(Paragraph("Travel Times by Car", styles["SectionSubHeader"]))
                                    elements.append(Spacer(1, 1))
                                    elements.append(HRFlowable(width="100%", thickness=1.2, color="#D8CAB8"))
                                    elements.append(Spacer(1, 4))

                                    
                                    # Create indented bulleted list
                                    elements.append(Indenter(left=20))  # Indent the list
                                    
                                    for location in travel_times:
                                        # Use HTML bullet point for proper rendering
                                        travel_text = f"&bull; {location['name']} – {location['travel_time']}"
                                        elements.append(Paragraph(travel_text, styles["Normal"]))
                                        logger.info(f"📝 Added bulleted travel time: {travel_text}")
                                    
                                    elements.append(Spacer(1, 10))
                                else:
                                    logger.info("📝 No travel times to display")
                            else:
                                logger.warning("⚠️ Commute map generation returned None (no important locations or API error)")
                        elif not google_maps_api_key:
                            logger.warning("⚠️ GOOGLE_MAPS_API_KEY not found - skipping commute map generation")
                        elif not user_preferences:
                            logger.warning("⚠️ User preferences not provided - skipping commute map generation")
                    except Exception as map_error:
                        logger.error(f"❌ Error generating commute map: {str(map_error)}")
                        # Don't fail the entire PDF if map generation fails
                
                elements.append(Indenter(left=1))
                _add_section(elements, section_data, styles)
                elements.append(Indenter(left=-1))
            elif isinstance(section_data, list):
                logger.info(f"📝 Processing {section} as list with {len(section_data)} items")
                for item in section_data:
                    elements.append(Indenter(left=1))
                    if isinstance(item, dict):
                        _add_section(elements, item, styles)
                    else:
                        elements.append(Paragraph(f"- {item}", styles["Body"]))
                    elements.append(Indenter(left=-1))
            else:
                logger.info(f"📝 Processing {section} as simple text: {str(section_data)[:100]}...")
                elements.append(Paragraph(str(section_data), styles["Body"]))
        
        # Render side-by-side charts after all sections are processed
        logger.info(f"📊 Chart tables cached: {list(chart_tables.keys())}")
        if "age_distribution" in chart_tables and "lifestyle_dna" in chart_tables:
            logger.info("📊 Rendering side-by-side charts...")
            side_by_side = Table(
                [[chart_tables["age_distribution"], chart_tables["lifestyle_dna"]]],
                colWidths=[3.6 * inch, 3.6 * inch],
                hAlign='CENTER'
            )
            side_by_side.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            elements.append(Spacer(1, 10))
            elements.append(side_by_side)
            elements.append(Spacer(1, 20))
            logger.info("✅ Side-by-side charts added to PDF elements")
        elif len(chart_tables) > 0:
            logger.warning(f"⚠️ Only {len(chart_tables)} chart(s) cached, cannot render side-by-side: {list(chart_tables.keys())}")
        else:
            logger.warning("⚠️ No charts cached for rendering")
            
        logger.info(f"📄 Building PDF document with {len(elements)} elements")
        doc.build(elements)
        pdf_data = pdf_buffer.getvalue()
        pdf_buffer.close()
        logger.info(f"✅ PDF creation completed - size: {len(pdf_data)} bytes")

        s3_key = s3_service.upload_pdf(pdf_data, filename, 'application/pdf')
        logger.info(f"📤 PDF upload result - s3_key: {s3_key}")

        if s3_key:
            try:
                import json
                json_data = json.dumps(report, indent=1).encode('utf-8')
                # Create JSON filename with simplified tree structure: userid/json/type/filename
                # Extract the path components from the PDF filename
                if '/' in filename:
                    # New tree structure: userid/reports/type/filename.pdf -> userid/json/type/filename.json
                    path_parts = filename.split('/')
                    if len(path_parts) >= 3 and path_parts[1] == 'reports':
                        user_id = path_parts[0]
                        report_type = path_parts[2]
                        pdf_filename = path_parts[3]
                        json_filename = f"{user_id}/json/{report_type}/{pdf_filename.removesuffix('.pdf')}.json"
                    else:
                        # Fallback for unexpected structure
                        json_filename = f"{filename.removesuffix('.pdf')}.json"
                else:
                    # Old flat structure fallback
                    json_filename = f"{filename.removesuffix('.pdf')}.json"
                
                logger.info(f"📁 PDF filename input: {filename}")
                logger.info(f"📁 JSON filename output: {json_filename}")
                logger.info(f"Uploading JSON file to: {json_filename}")
                s3_service.upload_pdf(json_data, json_filename, 'application/json')
            except Exception as e:
                logger.error(f"Failed to save raw JSON to S3: {str(e)}")

        if s3_key:
            logger.info("S3 upload successful, generating presigned URL")
            presigned_url = s3_service.generate_presigned_url(s3_key, download_filename=filename)
            return presigned_url if presigned_url else s3_key

    except Exception as e:
        logger.error(f"Error creating PDF for address {address}: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

def _fetch_image_from_serp(prompt: str) -> str:
    if not SERP_API_KEY:
        logger.warning("SERP_API_KEY not set; cannot fetch images.")
        return ""

    BAD_IMAGE_DOMAINS = [
        # Social Media & CDN variants
        "facebook.com",
        "lookaside.fbsbx.com",
        "instagram.com",
        "lookaside.instagram.com",
        "cdninstagram.com",
        "twitter.com",
        "twimg.com",
        "linkedin.com",
        "licdn.com",
        "pinterest.com",
        "pinimg.com",
        "tumblr.com",
        "tiktokcdn.com",
        "tiktok.com",
        "reddit.com",
        "redd.it",

        # Stock & Watermarked Image Sites
        "shutterstock.com",
        "shutterstock.com/image",
        "shutterstock.com/thumb",
        "dreamstime.com",
        "istockphoto.com",
        "gettyimages.com",
        "alamy.com",
        "123rf.com",
        "depositphotos.com",
        "bigstockphoto.com",
        "adobe.com/stock",
        "canstockphoto.com",
        "fotolia.com",

        # E-commerce / Shopping platforms
        "amazon.com",
        "ebay.com",
        "etsy.com",
        "walmart.com",
        "shopify.com",
        "target.com",

        # Aggregators / Non-direct hosts
        "imdb.com",
        "flickr.com",
        "slideshare.net",
        "quora.com",
        "yelp.com",
        "tripadvisor.com",
        "zillow.com",
        "realtor.com",

        # Miscellaneous / low-quality / license-ambiguous
        "freepik.com",
        "pexels.com",
        "unsplash.com",  # Optional: often high quality, but licensing can vary
        "pixabay.com",
        "picclick.com",
        "publicdomainpictures.net",
        "wallpaperflare.com",
        "wallpapercave.com",
        "wallhaven.cc",
        "deviantart.net",
        "artstation.com",
        "media-amazon.com",
        "blogspot.com",
        "wordpress.com",
    ]

    try:
        params = {
            "engine": "google",
            "q": prompt,
            "tbm": "isch",
            "num": "5",
            "api_key": SERP_API_KEY,
        }
        query_str = "&".join(f"{k}={quote_plus(str(v))}" for k, v in params.items())
        response = requests.get(f"{SERP_API_ENDPOINT}?{query_str}", timeout=30)

        if response.status_code == 200:
            data = response.json()
            images_results = data.get("images_results", [])
            for result in images_results:
                candidate = result.get("original") or result.get("thumbnail") or ""
                if not candidate:
                    continue
                if any(domain in candidate for domain in BAD_IMAGE_DOMAINS):
                    logger.debug(f"[SERP FILTER] Skipping bad image domain: {candidate}")
                    continue
                logger.debug(f"[SERP] Using image URL: {candidate}")
                return candidate

        logger.warning(f"SERP API returned no usable image for prompt: '{prompt}'")
    except Exception as e:
        logger.warning(f"SERP API error for prompt '{prompt}': {e}")

    return ""





def _resize_image_to_fit(img_data: BytesIO, target_width: float = 3.6 * inch, target_height: float = 2.0 * inch, is_chart: bool = False) -> Image:
    pil_img = PILImage.open(img_data)
    
    # Convert to RGB if in P or RGBA mode to prevent format issues
    if pil_img.mode not in ("RGB", "L"):
        logger.info(f"🖼️ Converting image from {pil_img.mode} mode to RGB")
        pil_img = pil_img.convert("RGB")
    
    # Apply image enhancement pipeline to all images except charts/graphs
    if not is_chart:
        pil_img = _enhance_image_for_pdf(pil_img)
    
    width, height = pil_img.size
    aspect_ratio = width / height

    # Fit into box with consistent size while maintaining aspect ratio
    if aspect_ratio > 1:
        # Wide image: fit to width, scale height proportionally
        display_width = target_width
        display_height = target_width / aspect_ratio
    else:
        # Tall image: fit to height, scale width proportionally
        display_height = target_height
        display_width = target_height * aspect_ratio

    # Apply minimum size constraints only for non-chart images
    # Charts should respect their target dimensions for specific sizing
    if not is_chart:
        min_width = 3.2 * inch
        min_height = 1.6 * inch
        display_width = max(display_width, min_width)
        display_height = max(display_height, min_height)
    else:
        # For charts, ensure they don't get too small but respect target dimensions
        min_chart_width = 2.5 * inch
        min_chart_height = 1.0 * inch
        display_width = max(display_width, min_chart_width)
        display_height = max(display_height, min_chart_height)
    
    # Convert enhanced PIL image back to BytesIO for ReportLab
    enhanced_img_data = BytesIO()
    pil_img.save(enhanced_img_data, format='PNG')
    enhanced_img_data.seek(0)
    
    return Image(enhanced_img_data, width=display_width, height=display_height)

def _resize_image_for_side_by_side(img_data: BytesIO, target_width: float = 2.5 * inch, target_height: float = 2.0 * inch, is_chart: bool = False) -> Image:
    """
    Resize image for side-by-side display (smaller than single centered image).
    """
    pil_img = PILImage.open(img_data)
    
    # Apply image enhancement pipeline to all images except charts/graphs
    if not is_chart:
        pil_img = _enhance_image_for_pdf(pil_img)
    
    width, height = pil_img.size
    aspect_ratio = width / height

    # Fit into smaller box for side-by-side display
    if aspect_ratio > 1:
        display_width = target_width
        display_height = target_width / aspect_ratio
    else:
        display_height = target_height
        display_width = target_height * aspect_ratio

    # Minimum sizes for side-by-side images
    min_width = 2.0 * inch
    min_height = 1.5 * inch
    display_width = max(display_width, min_width)
    display_height = max(display_height, min_height)

    # Convert enhanced PIL image back to BytesIO for ReportLab
    enhanced_img_data = BytesIO()
    pil_img.save(enhanced_img_data, format='PNG')
    enhanced_img_data.seek(0)
    
    return Image(enhanced_img_data, width=display_width, height=display_height)


def _resize_image_for_home_hero(img_data: BytesIO, target_width: float = 5.0 * inch, target_height: float = 3.5 * inch) -> Image:
    """
    Resize image for large home hero display (bigger and more prominent than regular images).
    """
    pil_img = PILImage.open(img_data)
    
    # Apply image enhancement pipeline for home images    
    width, height = pil_img.size
    aspect_ratio = width / height

    # Fit into larger box for hero home image display
    if aspect_ratio > 1:
        display_width = target_width
        display_height = target_width / aspect_ratio
    else:
        display_height = target_height
        display_width = target_height * aspect_ratio

    # Minimum sizes for home hero images (larger than regular images)
    min_width = 4.0 * inch
    min_height = 2.5 * inch
    display_width = max(display_width, min_width)
    display_height = max(display_height, min_height)

    # Convert enhanced PIL image back to BytesIO for ReportLab
    enhanced_img_data = BytesIO()
    pil_img.save(enhanced_img_data, format='PNG')
    enhanced_img_data.seek(0)
    
    return Image(enhanced_img_data, width=display_width, height=display_height)


# Dictionary of field patterns that should be treated as subheaders
# These are fields that were previously nested models but have been flattened
FLATTENED_FIELD_PATTERNS = {
    # Schools fields
    "preschool_": "Preschool",
    "elementary_": "Elementary School",
    "middle_": "Middle School",
    "high_": "High School",
    # LocalAmenities fields
    "restaurant_": "Restaurant",
    "activity_": "Activity",
    "park_": "Park",
    "grocery_store_": "Grocery Store",
    # UtilityCosts fields (now in EnvironmentUtilities)
    "utility_": "Utility Costs"
}

def _add_property_data_section(elements, data, styles):
    """
    Add property data section with special aesthetic styling for enhanced visual appeal.
    """
    # Create elegant property data cards with enhanced styling
    property_cards = []
    
    # Add price card with Zillow link in same row
    if 'price' in data and data['price'] is not None:
        price_value = f"${data['price']:,}" if isinstance(data['price'], (int, float)) else str(data['price'])
        
        # Create Zillow link if available
        zillow_cell = ""
        if 'zillow_url' in data and data['zillow_url']:
            zillow_cell = f'<link href="{data["zillow_url"]}" color="#6A7B52"><u>View on Zillow</u></link>'
        
        price_table = Table([
            [Paragraph("<b>Price</b>", styles["SubHeader"]),
             Paragraph(price_value, styles["Body"]),
             Paragraph(zillow_cell, styles["Body"])]
        ], colWidths=[1.5 * inch, 3.0 * inch, 1.5 * inch])
        
        price_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), "#f8f8f8"),
            ("BORDER", (0, 0), (-1, -1), 1, "#D8CAB8"),
            ("ROUNDEDCORNERS", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (1, 0), "LEFT"),  # Left align price label and value
            ("ALIGN", (2, 0), (2, 0), "RIGHT"),  # Right align Zillow link
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        
        property_cards.append(price_table)
        property_cards.append(Spacer(1, 6))
    
    # Create compact row for bedrooms, bathrooms, living area, and property type
    compact_fields = []
    if 'bedrooms' in data and data['bedrooms'] is not None:
        compact_fields.append(f"{data['bedrooms']} bed")
    if 'bathrooms' in data and data['bathrooms'] is not None:
        compact_fields.append(f"{data['bathrooms']} bath")
    if 'living_area' in data and data['living_area'] is not None:
        area_value = f"{data['living_area']:,} sq ft" if isinstance(data['living_area'], (int, float)) else str(data['living_area'])
        compact_fields.append(area_value)
    if 'property_type' in data and data['property_type'] is not None:
        compact_fields.append(str(data['property_type']))
    
    if compact_fields:
        compact_text = " • ".join(compact_fields)
        compact_table = Table([
            [Paragraph(compact_text, styles["Caption"])]
        ], colWidths=[6.0 * inch])
        
        compact_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), "#f8f8f8"),
            ("BORDER", (0, 0), (-1, -1), 1, "#D8CAB8"),
            ("ROUNDEDCORNERS", (0, 0), (-1, -1), 6),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),  # Left align compact details
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        
        property_cards.append(compact_table)
        property_cards.append(Spacer(1, 6))
    
    # Add remaining fields (lot area, lot unit, status)
    remaining_fields = [
        ('lot_area', 'Lot Area', lambda x: f"{x:,}" if isinstance(x, (int, float)) else str(x)),
        ('lot_unit', 'Lot Unit', str),
        ('listing_status', 'Status', str),
    ]
    
    for field_key, display_name, formatter in remaining_fields:
        if field_key in data and data[field_key] is not None:
            value = formatter(data[field_key])
            
            card_table = Table([
                [Paragraph(f"<b>{display_name}</b>", styles["SubHeader"]),
                 Paragraph(value, styles["Body"])]
            ], colWidths=[2.0 * inch, 4.0 * inch])
            
            card_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), "#f8f8f8"),
                ("BORDER", (0, 0), (-1, -1), 1, "#D8CAB8"),
                ("ROUNDEDCORNERS", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]))
            
            property_cards.append(card_table)
            property_cards.append(Spacer(1, 6))
    
    # Add all property cards
    elements.extend(property_cards)
    
    # Add commute times if available
    if 'commute_times' in data and data['commute_times']:
        elements.append(Spacer(1, 12))
        elements.append(Paragraph("Commute Times", styles["SectionSubHeader"]))
        elements.append(HRFlowable(width="50%", thickness=0.8, color="#D8CAB8", hAlign='LEFT'))
        elements.append(Spacer(1, 6))
        
        for location in data['commute_times']:
            commute_text = f"• {location.get('name', 'Unknown')} – {location.get('travel_time', 'N/A')}"
            elements.append(Paragraph(commute_text, styles["Body"]))
        elements.append(Spacer(1, 8))
    
    # Zillow link is now handled in the price row, so remove this section

def _add_section(elements, data, styles, level=0):
    indent = "  " * level
    logger.debug(f"[SECTION KEYS] Level {level}, keys: {[k for k in data.keys()]}")
    
    # Group flattened fields by their pattern prefix
    flattened_groups = {}
    regular_fields = {}
    
    # First pass: identify and group flattened fields
    for k, v in data.items():
        is_flattened = False
        for pattern, title in FLATTENED_FIELD_PATTERNS.items():
            if k.startswith(pattern):
                if pattern not in flattened_groups:
                    flattened_groups[pattern] = {"title": title, "fields": {}}
                flattened_groups[pattern]["fields"][k] = v
                is_flattened = True
                break
        
        if not is_flattened:
            regular_fields[k] = v
    
    # Process flattened field groups first
    for pattern, group in flattened_groups.items():
        # Special handling for school fields vs other fields
        is_school_field = pattern in ["preschool_", "elementary_", "middle_", "high_"]
        
        # For non-school fields, add a group header
        if not is_school_field:
            if level == 0:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<b>{group['title']}:</b>", styles["SectionSubHeader"]))
                elements.append(HRFlowable(width="30%", thickness=0.5, color="#AAAAAA", hAlign='LEFT'))
            elif level == 1:
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>{group['title']}:</b>", styles["SubHeader"]))
        
        # Process fields within this group
        for k, v in group["fields"].items():
            # Format the field name without the prefix
            field_name = k.replace(pattern, "").replace("_", " ").title()
            
            # For school fields, if it's a name field, make it a subheader
            if is_school_field and field_name.lower() == "name" and v is not None:
                if level == 0:
                    elements.append(Spacer(1, 12))
                    elements.append(Paragraph(f"<b>{v}:</b>", styles["SectionSubHeader"]))
                    elements.append(HRFlowable(width="30%", thickness=0.5, color="#AAAAAA", hAlign='LEFT'))
                elif level == 1:
                    elements.append(Spacer(1, 6))
                    elements.append(Paragraph(f"<b>{v}:</b>", styles["SubHeader"]))
                continue  # Skip the normal field processing for school names
            
            # Process the field value
            if isinstance(v, dict):
                elements.append(Paragraph(f"<b>{field_name}:</b>", styles["Body"]))
                _add_section(elements, v, styles, level + 2)
            elif isinstance(v, list):
                elements.append(Paragraph(f"<b>{field_name}:</b>", styles["Body"]))
                for item in v:
                    if isinstance(item, dict):
                        _add_section(elements, item, styles, level + 2)
                    else:
                        elements.append(Paragraph(f"- {item}", styles["Body"]))
            elif v is not None:  # Skip None values
                value = Paragraph(str(v), styles["Body"])
                table = Table([[Paragraph(f"<b>{field_name}:</b>", styles["Body"]), value]], colWidths=[1.5 * inch, 4.5 * inch])
                table.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                ]))
                elements.append(table)
    
    # Now process regular fields
    for k, v in regular_fields.items():
        key = k.replace("_", " ").title()

        # CHARTS - Handle both dict and Pydantic model objects
        chart_buffer = None
        chart_type = ""
        chart_data = None
        
        # Handle top-level Pydantic model objects (new structure)
        if hasattr(v, 'with_percent') and callable(getattr(v, 'with_percent')):
            # This is a Pydantic model with with_percent method (AgeDistribution or LifestyleDNA)
            chart_data = v.with_percent()
            if k.lower() == "lifestyle_dna":
                chart_buffer = generate_horizontal_bar_chart(chart_data, key)
                chart_type = "Lifestyle DNA Bar Chart"
            elif k.lower() == "age_distribution":
                chart_buffer = generate_vertical_lollipop_chart(chart_data, key)
                chart_type = "Age Distribution Chart"
        # Handle dictionary structure (both legacy and current formats)
        elif isinstance(v, dict):
            # Check if this is age_distribution or lifestyle_dna dictionary
            if k.lower() == "lifestyle_dna":
                # Convert raw field names to display format with percentages
                chart_data = {field_name: f"{value}%" for field_name, value in v.items()}
                chart_buffer = generate_horizontal_bar_chart(chart_data, key)
                chart_type = "Lifestyle DNA Bar Chart"
            elif k.lower() == "age_distribution":
                # Convert age field names (age_18_24 -> 18-24) and add percentages
                chart_data = {}
                for field_name, value in v.items():
                    if field_name.startswith('age_'):
                        # Convert age_18_24 -> 18-24, age_65_plus -> 65+
                        display_name = field_name.replace('age_', '').replace('_plus', '+').replace('_', '-')
                        chart_data[display_name] = f"{value}%"
                    else:
                        chart_data[field_name] = f"{value}%"
                chart_buffer = generate_vertical_lollipop_chart(chart_data, key)
                chart_type = "Age Distribution Chart"
            else:
                # Only create charts for specific numeric/percentage fields
                chartable_fields = {
                    'demographics', 'income_distribution', 'education_levels', 'employment_stats',
                    'safety_metrics', 'transportation_usage'
                }
                
                # Check if this field should be charted based on field name and data type
                should_chart = False
                if k.lower() in chartable_fields:
                    # Check if the dictionary contains chartable numeric or percentage data
                    chartable_values = 0
                    total_values = len(v)
                    
                    for val in v.values():
                        if val is None:
                            continue
                            
                        # Direct numeric values are always chartable
                        if isinstance(val, (int, float)):
                            chartable_values += 1
                            continue
                            
                        # For strings, check if they're chartable formats
                        if isinstance(val, str):
                            val_stripped = val.strip()
                            
                            # Skip empty strings
                            if not val_stripped:
                                continue
                                
                            # Simple percentage (e.g., "25%", "High", "Moderate")
                            if val_stripped.endswith('%') and val_stripped[:-1].replace('.', '').isdigit():
                                chartable_values += 1
                                continue
                                
                            # Rating format (e.g., "8.5/10")
                            if '/' in val_stripped and val_stripped.split('/')[0].replace('.', '').isdigit():
                                chartable_values += 1
                                continue
                                
                            # Simple categorical values (High, Medium, Low, etc.)
                            if val_stripped.lower() in ['high', 'medium', 'low', 'very high', 'very low', 'moderate', 'popular', 'very popular', 'unpopular']:
                                chartable_values += 1
                                continue
                                
                            # Skip complex strings like price ranges, addresses, descriptions
                            if any(char in val_stripped for char in ['$', '-', '/', ' to ', ' and ', 'month', 'year', 'per']):
                                logger.debug(f"📝 Skipping non-chartable value: '{val_stripped}' (contains price/range indicators)")
                                continue
                    
                    # Only chart if most values are chartable (at least 50%)
                    if total_values > 0 and chartable_values >= (total_values * 0.5):
                        should_chart = True
                        logger.debug(f"📊 Will chart '{k}': {chartable_values}/{total_values} values are chartable")
                    else:
                        logger.debug(f"📝 Skipping chart for '{k}': only {chartable_values}/{total_values} values are chartable")
                
                if should_chart:
                    chart_data = v
                    chart_buffer = generate_horizontal_bar_chart(chart_data, key)
                    chart_type = "Data Chart"
                else:
                    # Skip chart generation for text-based fields
                    logger.debug(f"📝 Skipping chart for text-based field: {k}")

        if chart_buffer:
            label = Paragraph(f"<b>{key}:</b>", styles["SubHeader"])
            
            # Only add the chart image, no percentage data
            img = _resize_image_to_fit(chart_buffer, is_chart=True)
            table_data = [[img]]
            table = Table(table_data, colWidths=[6 * inch])
            table.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 30),
                ("RIGHTPADDING", (0, 0), (-1, -1), 30),
                ("TOPPADDING", (0, 0), (-1, -1), 15),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
            ]))
            elements.append(label)
            elements.append(Spacer(1, 0.1 * inch))   # More vertical spacing above chart
            elements.append(table)
            elements.append(Spacer(1, 0.1 * inch))   # Spacing before caption
            elements.append(Paragraph(f"{key} {chart_type}", styles["Caption"]))
            elements.append(Spacer(1, 0.2 * inch))   # More spacing before next section
            continue

        # HOME IMAGE PROMPT - Special handling for large hero home image
        if k.lower() == "home_image_prompt" and isinstance(v, str):
            elements.append(Spacer(1, 20))
            logger.debug(f"{indent}[HOME IMAGE PROMPT] key '{k}', prompt: {v}")
            
            # Fetch home image
            image_url = _fetch_image_from_serp(v)
            logger.debug(f"{indent}[HOME IMAGE PROMPT] Got image URL: {image_url}")
            
            if image_url:
                try:
                    response = requests.get(image_url, timeout=30)
                    if response.status_code == 200:
                        img_data = BytesIO(response.content)
                        home_img = _resize_image_for_home_hero(img_data)
                        
                        # Display large centered home image with special styling
                        elements.append(Spacer(1, 10))
                        table_data = [[home_img]]
                        table = Table(table_data, colWidths=[6.5 * inch])
                        table.setStyle(TableStyle([
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 10),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                            ("TOPPADDING", (0, 0), (-1, -1), 10),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                            ("INNERPADDING", (0, 0), (-1, -1), 10),
                        ]))
                        elements.append(table)
                        elements.append(Spacer(1, 15))
                        logger.debug(f"{indent}[HOME IMAGE PROMPT] Successfully added large home image")
                    else:
                        logger.warning(f"Failed to fetch home image, status code: {response.status_code}")
                except Exception as e:
                    logger.warning(f"Failed to fetch home image from URL {image_url}: {e}")
            else:
                logger.warning(f"No image URL returned for home image prompt: {v}")
            continue

        # COMMUNITY IMAGE 1 & 2 - Skip text content (handled together with community_image_1)
        if k.lower() == "community_image_2" and isinstance(v, str):
            continue

        # COMMUNITY IMAGE 1 (inline in dict) - Now handles dual community images side by side
        if k.lower() == "community_image_1" and isinstance(v, str):
            elements.append(Spacer(1, 15))
            logger.debug(f"{indent}[COMMUNITY IMAGE 1] key '{k}', prompt: {v}")
            
            # Check if there's also a community_image_2 in the same data dict
            second_prompt = None
            if isinstance(data, dict) and "community_image_2" in data:
                second_prompt = data["community_image_2"]
                logger.debug(f"{indent}[COMMUNITY IMAGE 2] found: {second_prompt}")
            
            # Fetch both community images
            image_url_1 = _fetch_image_from_serp(v)
            image_url_2 = _fetch_image_from_serp(second_prompt)
            
            logger.debug(f"{indent}[COMMUNITY IMAGES] Got image URLs: {image_url_1}, {image_url_2}")
            
            images = []
            
            # Try to fetch first community image
            if image_url_1:
                try:
                    response = requests.get(image_url_1, timeout=30)
                    if response.status_code == 200:
                        img_data = BytesIO(response.content)
                        img1 = _resize_image_for_side_by_side(img_data, is_chart=False)
                        images.append(img1)
                except Exception as e:
                    logger.warning(f"Failed to fetch first community image from URL {image_url_1}: {e}")
            
            # Try to fetch second community image
            if image_url_2:
                try:
                    response = requests.get(image_url_2, timeout=30)
                    if response.status_code == 200:
                        img_data = BytesIO(response.content)
                        img2 = _resize_image_for_side_by_side(img_data, is_chart=False)
                        images.append(img2)
                except Exception as e:
                    logger.warning(f"Failed to fetch second community image from URL {image_url_2}: {e}")
            
            # Display community images side by side if we have at least one
            if images:
                elements.append(Spacer(1, 6))
                
                if len(images) == 2:
                    # Two community images side by side
                    table_data = [[images[0], images[1]]]
                    table = Table(table_data, colWidths=[3 * inch, 3 * inch])
                    table.setStyle(TableStyle([
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 10),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                        ("TOPPADDING", (0, 0), (-1, -1), 10),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                        ("BOX", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                        ("INNERPADDING", (0, 0), (-1, -1), 6),
                    ]))
                elif len(images) == 1:
                    # Single community image centered
                    table_data = [[images[0]]]
                    table = Table(table_data, colWidths=[6 * inch])
                    table.setStyle(TableStyle([
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 30),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 30),
                        ("TOPPADDING", (0, 0), (-1, -1), 15),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
                        ("BOX", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                        ("INNERPADDING", (0, 0), (-1, -1), 6),
                    ]))
                
                elements.append(table)
                elements.append(Spacer(1, 10))
                logger.debug(f"{indent}[COMMUNITY IMAGES] Successfully added {len(images)} community image(s)")
            continue

        # IMAGE PROMPT_2 - Skip text content (handled together with image_prompt)
        if k.lower() == "image_prompt_2" and isinstance(v, str):
            continue

        # IMAGE PROMPT (inline in dict) - Now handles dual images side by side
        if k.lower() == "image_prompt" and isinstance(v, str):
            elements.append(Spacer(1, 15))
            logger.debug(f"{indent}[IMAGE PROMPT] key '{k}', prompt: {v}")
            
            # Check if there's also an image_prompt_2 in the same data dict
            second_prompt = None
            if isinstance(data, dict) and "image_prompt_2" in data:
                second_prompt = data["image_prompt_2"]
                logger.debug(f"{indent}[IMAGE PROMPT 2] found: {second_prompt}")
            
            # Fetch both images
            image_url_1 = _fetch_image_from_serp(v)
            image_url_2 = _fetch_image_from_serp(second_prompt)
            
            logger.debug(f"{indent}[IMAGE PROMPT] Got image URLs: {image_url_1}, {image_url_2}")
            
            images = []
            
            # Try to fetch first image
            if image_url_1:
                try:
                    response = requests.get(image_url_1, timeout=30)
                    if response.status_code == 200:
                        img_data = BytesIO(response.content)
                        img1 = _resize_image_for_side_by_side(img_data, is_chart=False)
                        images.append(img1)
                except Exception as e:
                    logger.warning(f"Failed to fetch first image from URL {image_url_1}: {e}")
            
            # Try to fetch second image
            if image_url_2:
                try:
                    response = requests.get(image_url_2, timeout=30)
                    if response.status_code == 200:
                        img_data = BytesIO(response.content)
                        img2 = _resize_image_for_side_by_side(img_data, is_chart=False)
                        images.append(img2)
                except Exception as e:
                    logger.warning(f"Failed to fetch second image from URL {image_url_2}: {e}")
            
            # Display images side by side if we have at least one
            if images:
                elements.append(Spacer(1, 6))
                
                if len(images) == 2:
                    # Two images side by side
                    table_data = [[images[0], images[1]]]
                    table = Table(table_data, colWidths=[3 * inch, 3 * inch])
                    table.setStyle(TableStyle([
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 10),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                        ("TOPPADDING", (0, 0), (-1, -1), 10),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                        ("BOX", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                        ("INNERPADDING", (0, 0), (-1, -1), 6),
                    ]))
                elif len(images) == 1:
                    # Single image centered
                    table_data = [[images[0]]]
                    table = Table(table_data, colWidths=[6 * inch])
                    table.setStyle(TableStyle([
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 30),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 30),
                        ("TOPPADDING", (0, 0), (-1, -1), 15),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 15),
                        ("BOX", (0, 0), (-1, -1), 0.25, colors.lightgrey),
                        ("INNERPADDING", (0, 0), (-1, -1), 6),
                    ]))
                
                elements.append(table)
                elements.append(Paragraph(key.replace(" Prompt", ""), styles["Caption"]))
                elements.append(Spacer(1, 3))
            continue

        # NESTED DICTS
        if isinstance(v, dict):
            # Check if dict has any content (primitive or nested)
            has_nested = any(isinstance(subv, (dict, list, str)) for subv in v.values())

            if level == 0:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SectionSubHeader"]))
                elements.append(HRFlowable(width="30%", thickness=0.5, color="#AAAAAA", hAlign='LEFT'))
            elif level == 1 and has_nested:
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SubHeader"]))
            else:
                elements.append(Paragraph(f"<b>{key}:</b>", styles["Body"]))

            _add_section(elements, v, styles, level + 1)
            continue


        # LISTS
        if isinstance(v, list):
            has_nested = any(isinstance(item, (dict, list, str)) for item in v)

            if level == 0:
                elements.append(Spacer(1, 12))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SectionSubHeader"]))
                elements.append(HRFlowable(width="30%", thickness=0.5, color="#AAAAAA", hAlign='LEFT'))
            elif level == 1 and has_nested:
                elements.append(Spacer(1, 6))
                elements.append(Paragraph(f"<b>{key}:</b>", styles["SubHeader"]))
            else:
                elements.append(Paragraph(f"<b>{key}:</b>", styles["Body"]))

            if v and isinstance(v[0], dict):
                for item in v:
                    elements.append(Spacer(0.5, 2))
                    _add_section(elements, item, styles, level + 1)
            else:
                for item in v:
                    elements.append(Paragraph(f"- {item}", styles["Body"]))

            continue

        # DEFAULT FIELDS
        value = Paragraph(str(v), styles["Body"])
        table = Table(
            [[Paragraph(f"<b>{key}:</b>", styles["Body"]), value]],
            colWidths=[1.6 * inch, 4.9 * inch]  # Adjust for your page size
        )
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(table)
        elements.append(Spacer(.5, .5))
