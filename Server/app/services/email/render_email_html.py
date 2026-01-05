"""
Email HTML renderer service.

Renders React Email components to HTML by calling the Node.js render script.
"""

import json
import os
import subprocess
import logging
import base64
from typing import Dict, List, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


def get_workspace_root() -> Path:
    """
    Get the workspace root directory (where Client/ and Server/ are located).
    
    Returns:
        Path to workspace root
    """
    # Get the Server/app directory
    server_app_dir = Path(__file__).parent.parent.parent
    # Go up to Server/, then up to workspace root
    workspace_root = server_app_dir.parent.parent
    return workspace_root


def get_logo_data_url() -> Optional[str]:
    """
    Get the logo file as a base64 data URL for embedding in emails.
    
    Returns:
        Base64 data URL string (e.g., "data:image/png;base64,...") or None if logo not found
    """
    try:
        workspace_root = get_workspace_root()
        logo_path = workspace_root / "Client" / "public" / "logo.png"
        
        if not logo_path.exists():
            logger.warning(f"Logo file not found at {logo_path}")
            return None
        
        # Read the logo file and convert to base64
        with open(logo_path, "rb") as f:
            logo_data = f.read()
        
        # Determine MIME type based on file extension
        mime_type = "image/png"  # logo.png is PNG
        
        # Encode as base64 data URL
        base64_data = base64.b64encode(logo_data).decode("utf-8")
        data_url = f"data:{mime_type};base64,{base64_data}"
        
        logger.debug(f"Successfully loaded logo as data URL ({len(data_url)} chars)")
        return data_url
        
    except Exception as e:
        logger.warning(f"Failed to load logo as data URL: {e}")
        return None


def render_email_html(template_name: str, props: Dict[str, Any]) -> str:
    """
    Render a React Email component to HTML.
    
    Args:
        template_name: Name of the email template (e.g., "ListingsEmail")
        props: Props to pass to the React component as a dictionary
        
    Returns:
        Rendered HTML string
        
    Raises:
        RuntimeError: If rendering fails
    """
    workspace_root = get_workspace_root()
    client_dir = workspace_root / "Client" / "apps" / "web"
    render_script = client_dir / "services" / "email" / "render-email.ts"
    
    if not render_script.exists():
        raise RuntimeError(
            f"Email render script not found at {render_script}. "
            "Make sure the Client directory is available."
        )
    
    # Change to client directory to ensure relative imports work
    original_cwd = os.getcwd()
    
    try:
        os.chdir(client_dir)
        
        # Prepare command
        # Use pnpm if available, otherwise npm
        # Check for pnpm in PATH first, then check if it's installed via npm
        pnpm_cmd = subprocess.run(
            ["which", "pnpm"],
            capture_output=True,
            text=True,
            check=False
        )
        
        # Check for tsx (TypeScript executor) - prefer direct execution
        # Check in node_modules/.bin first, then try npx
        tsx_paths = [
            client_dir / "node_modules" / ".bin" / "tsx",
            Path("node_modules/.bin/tsx"),  # relative to workspace root
        ]
        
        tsx_found = None
        for tsx_path in tsx_paths:
            if tsx_path.exists():
                tsx_found = str(tsx_path.resolve())
                break
        
        if tsx_found:
            # Use tsx directly
            package_manager = "tsx (direct)"
            cmd = [
                tsx_found,
                "services/email/render-email.ts",
                template_name,
                json.dumps(props)
            ]
        else:
            # Fallback: use npx to run tsx
            npx_check = subprocess.run(
                ["which", "npx"],
                capture_output=True,
                text=True,
                check=False
            )
            
            if npx_check.returncode == 0:
                package_manager = "npx tsx"
                cmd = [
                    "npx",
                    "-y",
                    "tsx",
                    "services/email/render-email.ts",
                    template_name,
                    json.dumps(props)
                ]
            else:
                # Last resort: try pnpm/npm exec
                if pnpm_cmd.returncode == 0:
                    package_manager = "pnpm exec"
                    cmd = [
                        "pnpm",
                        "exec",
                        "tsx",
                        "services/email/render-email.ts",
                        template_name,
                        json.dumps(props)
                    ]
                else:
                    raise RuntimeError(
                        "Cannot find tsx. Install dependencies with: pnpm install"
                    )
        
        logger.info(
            f"Rendering email template '{template_name}' using {package_manager} "
            f"with props keys: {list(props.keys())}"
        )
        
        # Run the render script
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            timeout=30,  # 30 second timeout
        )
        
        html = result.stdout
        
        if not html or len(html.strip()) == 0:
            raise RuntimeError(
                f"Email render script returned empty output. "
                f"Stderr: {result.stderr}"
            )
        
        logger.info(f"Successfully rendered email template '{template_name}' ({len(html)} chars)")
        return html
        
    except subprocess.TimeoutExpired:
        raise RuntimeError(
            f"Email render script timed out after 30 seconds for template '{template_name}'"
        )
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr or e.stdout or "Unknown error"
        raise RuntimeError(
            f"Failed to render email template '{template_name}': {error_msg}"
        )
    except Exception as e:
        raise RuntimeError(
            f"Unexpected error rendering email template '{template_name}': {str(e)}"
        )
    finally:
        os.chdir(original_cwd)


def convert_home_universal_to_listing_dict(home) -> Dict[str, Any]:
    """
    Convert a HomeUniversal model instance to a listing dictionary
    for use in email templates.
    
    Args:
        home: HomeUniversal model instance
        
    Returns:
        Dictionary with listing data
    """
    return {
        "id": str(home.id),
        "address": home.address or "Address not available",
        "price": home.price or "Price not available",
        "bedrooms": int(home.beds) if home.beds and home.beds.isdigit() else None,
        "bathrooms": int(home.baths) if home.baths and home.baths.isdigit() else None,
        "sqft": int(home.sqft) if home.sqft and home.sqft.isdigit() else None,
        "score": float(home.score) if home.score is not None else None,
        "imageUrl": home.image_url,
    }
