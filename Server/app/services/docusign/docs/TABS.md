# DocuSign Tab Configuration

## Overview

DocuSign tabs define where recipients interact with documents (signatures, dates, initials, etc.). This guide explains how SilverKey configures tabs for e-signature workflows.

## Tab Types

### Primary Tabs (Currently Implemented)

#### 1. PDF form fields (primary)
- Purpose: Signatures, dates, text boxes, checkboxes, and other fields defined as **AcroForm fields** in the PDF.
- Configuration: `EnvelopeBuilder._build_document()` sets **`transformPdfFields`: `true`** on the document so DocuSign converts PDF fields into tabs.
- **Assignment:** `assignTabsToRecipientId` is set to the **first signer** (lowest `routing_order`). Multi-signer PDFs should use DocuSign field naming / composite templates if fields must route to different recipients.

#### 2. SignHere / DateSigned / printed name (removed)
- SilverKey **no longer** adds fallback coordinate-based Sign Here, date signed, or printed-name tabs at the bottom of page 1. Rely on the PDF’s fields (or sender prefill below).

#### 3. Text / checkbox tabs (optional API prefill)
- Purpose: Extra tabs from the send-agreement API (`tab_prefill` per participant).
- Configuration: `build_tabs_for_recipient()` in `utils/recipients.py` only merges these extras; carbon-copy recipients get **no** tabs from this helper.

### Additional Tab Types (Future)

- **InitialHere**: For initials (anchor: `INITIAL HERE`)
- **Radio**: For multiple choice
- **Dropdown**: For dropdown selections
- **Title**: For job title/role

## Envelope text custom fields (metadata)

SilverKey sets **envelope-level** `textCustomFields` on create (not visible as PDF fields). See `_build_custom_fields()` in `envelopes/builder.py`. Fields include `agreement_id`, `buyer_id`, and `agent_id` for DocuSign search and reporting (`show: true` in the DocuSign UI by default).

## Positioning Methods

### Method 1: Anchor-Based (Recommended)

Anchor-based tabs search for specific text strings in the PDF and position the tab relative to that text.

**Advantages:**
- Works regardless of PDF layout changes
- Easy to maintain
- Self-documenting (anchor text visible in PDF source)

**How it works:**
1. PDF generation includes anchor text (e.g., "SIGN HERE")
2. DocuSign searches PDF for the anchor string
3. Tab is positioned at specified offset from anchor

**Example anchor configuration:**
```python
{
    "anchorString": "SIGN HERE",
    "anchorXOffset": "0",        # Pixels right from anchor
    "anchorYOffset": "-10",      # Pixels up from anchor (negative = up)
    "anchorUnits": "pixels",
    "anchorIgnoreIfNotPresent": "false"  # Fail if anchor not found
}
```

**Best practices:**
- Use unique anchor strings per tab position
- Make anchor text subtle but visible in PDF
- Test with actual PDFs to verify positioning
- Use negative Y offset to place tab above anchor text

### Method 2: Coordinate-Based (Fallback)

Coordinate-based tabs use absolute pixel positions on the page.

**Disadvantages:**
- Brittle: breaks if PDF layout changes
- Hard to maintain: requires manual measurement
- Not recommended unless anchor-based is impossible

**When to use:**
- Legacy PDFs without embedded anchor text
- Third-party PDFs you can't modify
- Testing/prototyping only

**Example coordinate configuration:**
```python
{
    "pageNumber": "1",
    "xPosition": "100",    # Pixels from left edge
    "yPosition": "400"     # Pixels from top edge
}
```

## PDF Generation Requirements

For anchor-based tabs to work, your PDF generation process MUST include anchor text:

### Required Anchor Text

1. **SIGN HERE** - For signature fields
2. **DATE SIGNED** - For date fields (optional)

### Placement Guidelines

- Place anchor text where you want the signature box to appear
- Use a small, subtle font (8-10pt, light gray)
- Position in margin or near signature line
- Test visibility: should be unobtrusive but findable

### Example PDF Layout

```
[Document content...]

By signing below, I agree to the terms:

Signature: ____________________    SIGN HERE
Date: _________________________    DATE SIGNED

[More content...]
```

## Implementation

### Adding Tabs to Recipients

Recipients are built with `build_recipient_from_participant()`. The `tabs` key is **omitted** when there is no `tab_prefill` for that signer (PDF transform supplies the main fields).

```python
from app.services.docusign.utils.recipients import build_recipient_from_participant

recipient = build_recipient_from_participant(participant)
# May omit "tabs" entirely when relying on transformPdfFields + PDF-only fields.
```

### Custom Tab Configuration

For custom tab positions (advanced use case):

```python
from app.services.docusign.utils.recipients import build_tabs_coordinate_fallback

# Override default tabs with custom coordinates
custom_tabs = build_tabs_coordinate_fallback(
    participant=participant,
    page_number=2,       # Signature on page 2
    x_position=150,      # 150px from left
    y_position=500       # 500px from top
)

recipient["tabs"] = custom_tabs
```

## Multi-Signer Workflows

When multiple signers are required, tabs are configured per recipient:

```python
# Signer 1 (buyer)
buyer_recipient = {
    "routingOrder": "1",
    "tabs": build_tabs_for_recipient(buyer_participant)
}

# Signer 2 (co-buyer)
cobuyer_recipient = {
    "routingOrder": "2",  # Signs after buyer
    "tabs": build_tabs_for_recipient(cobuyer_participant)
}
```

**Sequential signing flow:**
1. Buyer receives email, signs
2. After buyer signs, co-buyer receives email
3. After all sign, envelope completes

## Troubleshooting

### Tabs Not Appearing

**Problem:** DocuSign sends envelope but tabs don't show up

**Causes:**
1. Anchor text not in PDF
2. Anchor string misspelled
3. `anchorIgnoreIfNotPresent: false` and anchor missing

**Solutions:**
- Verify PDF contains anchor text
- Check spelling matches exactly (case-sensitive)
- Use `anchorIgnoreIfNotPresent: true` for optional tabs
- Review DocuSign envelope logs

### Wrong Tab Position

**Problem:** Tab appears in wrong location

**Causes:**
1. Wrong offset values
2. Multiple instances of anchor text
3. PDF layout changed

**Solutions:**
- Adjust `anchorXOffset` and `anchorYOffset`
- Make anchor text more unique
- Test with actual PDF before sending

### Tab Overlap

**Problem:** Multiple tabs appear on top of each other

**Causes:**
1. Same anchor text for multiple tabs
2. Coordinate conflict in multi-signer workflow

**Solutions:**
- Use unique anchor strings per tab
- Verify routing order is correct
- Check for duplicate recipient IDs

## Testing

### Test Checklist

- [ ] PDF includes required anchor text
- [ ] Tabs appear at correct positions
- [ ] Multiple signers see different tabs
- [ ] Sequential signing works (if applicable)
- [ ] Date fields auto-populate on signing
- [ ] Tabs don't overlap or collide

### Test PDFs

Create test PDFs with:
1. Clear "SIGN HERE" text
2. Clear "DATE SIGNED" text
3. Multiple signature locations (for multi-signer)
4. Different page layouts

### DocuSign Test Environment

Use DocuSign Demo account for testing:
- URL: https://demo.docusign.net
- Test signing without sending real envelopes
- Review tab placement before committing to production

## Future Enhancements

### Planned Features

1. **Initial fields** - Add "INITIAL HERE" tabs for page initials
2. **Checkbox fields** - For yes/no consents
3. **Custom tab library** - Predefined tab sets per agreement type
4. **Tab templates** - Reusable configurations
5. **Dynamic positioning** - Calculate positions based on PDF content

### Database Storage

Consider adding `AgreementParticipant.tab_config` (JSON field) for custom per-participant tab configurations:

```python
# Example tab_config structure
{
    "method": "anchor",  # or "coordinate"
    "tabs": {
        "signHereTabs": [
            {
                "anchorString": "BUYER SIGNATURE",
                "anchorXOffset": "50",
                "anchorYOffset": "-15"
            }
        ]
    }
}
```

## References

- [DocuSign Tabs API](https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopetabs/)
- [Anchor Tab Positioning](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/tabs/auto-place/)
- [Tab Types Reference](https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/tabs/)

## Support

For tab configuration issues:
1. Check this guide
2. Review `Server/app/services/docusign/docs/README.md`
3. Test with DocuSign Demo account
4. Check DocuSign envelope logs
5. Contact DocuSign support for API-specific issues
