"""
Comprehensive offer service layer for managing offer document generation and packages.
This service provides high-level operations for creating, managing, and submitting offer packages.
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.exc import SQLAlchemyError

from app import db
from app.models.pdf_document import PDFDocument
from app.models.user import User
from app.models.offer_models import (
    OfferPackage, DocumentType, GenerateOfferRequest, GenerateOfferResponse,
    PurchaseAgreement, PreApprovalLetter, EarnestMoneyInstructions, CoverLetter,
    PropertyAddress, PersonInfo, OfferDecisionAction, PreApprovalAction,
    EarnestMoneyAction, CoverLetterAction
)
# from app.services.offer.generate import generate_report as generate_offer_section
# TODO: Fix this import once the offer generation service is properly implemented

# Temporary placeholder function to prevent server startup errors
def generate_offer_section(*args, **kwargs):
    """Temporary placeholder for offer generation functionality"""
    return {
        'success': False,
        'error': 'Offer generation service not yet implemented',
        'message': 'This feature is under development'
    }
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)


class OfferService:
    """
    High-level service for managing offer document generation and packages.
    Provides unified interface for creating complete offer packages.
    """
    
    @staticmethod
    def create_offer_package(user_id: str, property_address: str) -> OfferPackage:
        """
        Create a new offer package for a user and property.
        
        Args:
            user_id: ID of the user creating the offer
            property_address: Target property address
            
        Returns:
            OfferPackage: New offer package instance
        """
        try:
            # Parse property address (simplified - in production, use address validation service)
            address_parts = property_address.split(', ')
            if len(address_parts) >= 3:
                line1 = address_parts[0]
                city_state_zip = address_parts[-1].split(' ')
                city = address_parts[-2] if len(address_parts) > 3 else city_state_zip[0]
                state = city_state_zip[-2] if len(city_state_zip) >= 2 else ""
                postal_code = city_state_zip[-1] if len(city_state_zip) >= 1 else ""
            else:
                line1 = property_address
                city = state = postal_code = ""
            
            parsed_address = PropertyAddress(
                line1=line1,
                city=city,
                state=state,
                postal_code=postal_code
            )
            
            package = OfferPackage(
                package_id=str(uuid.uuid4()),
                user_id=user_id,
                property_address=parsed_address
            )
            
            logger.info(f"📦 Created new offer package {package.package_id} for user {user_id}")
            return package
            
        except Exception as e:
            logger.error(f"❌ Failed to create offer package: {str(e)}")
            raise
    
    @staticmethod
    def generate_document(
        user_id: str,
        section_type: str,
        property_address: str,
        params: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> Tuple[GenerateOfferResponse, Optional[Dict[str, Any]]]:
        """
        Generate a single offer document using the offer generation service.
        
        Args:
            user_id: ID of the user generating the document
            section_type: Type of document to generate
            property_address: Property address
            params: Document-specific parameters
            user_preferences: User preferences for personalization
            
        Returns:
            Tuple of (GenerateOfferResponse, generated_data)
        """
        try:
            document_id = str(uuid.uuid4())
            filename = f"{section_type}_{document_id}.pdf"
                        
            # Call the core generation service
            result = generate_offer_section(
                section_type=section_type,
                address=property_address,
                filename=filename,
                user_id=user_id,
                params=params,
                user_preferences=user_preferences
            )
            
            # Save document record to database
            pdf_doc = PDFDocument(
                id=document_id,
                user_id=user_id,
                filename=filename,
                file_path=f"offers/{filename}",
                status='processed'
            )
            db.session.add(pdf_doc)
            db.session.commit()
            
            # Create response
            response = GenerateOfferResponse(
                success=True,
                document_id=document_id,
                document_type=DocumentType(section_type),
                status="generated",
                message=f"{section_type.replace('_', ' ').title()} generated successfully",
                data=result.get('data', {})
            )
            
            logger.info(f"✅ Successfully generated {section_type} document {document_id}")
            return response, result.get('data')
            
        except Exception as e:
            logger.error(f"❌ Failed to generate {section_type} document: {str(e)}")
            
            error_response = GenerateOfferResponse(
                success=False,
                document_id=document_id if 'document_id' in locals() else str(uuid.uuid4()),
                document_type=DocumentType(section_type),
                status="error",
                message=f"Failed to generate {section_type}",
                error=str(e)
            )
            return error_response, None
    
    @staticmethod
    def generate_complete_offer_package(
        user_id: str,
        property_address: str,
        offer_params: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> OfferPackage:
        """
        Generate a complete offer package with all recommended documents.
        
        Args:
            user_id: ID of the user creating the offer
            property_address: Target property address
            offer_params: Parameters for offer generation
            user_preferences: User preferences for personalization
            
        Returns:
            OfferPackage: Complete offer package with generated documents
        """
        try:
            logger.info(f"🎯 Generating complete offer package for user {user_id}")
            
            # Create base package
            package = OfferService.create_offer_package(user_id, property_address)
            
            # Generate purchase agreement (always required)
            purchase_response, purchase_data = OfferService.generate_document(
                user_id=user_id,
                section_type="purchase_agreement",
                property_address=property_address,
                params=offer_params.get('purchase_agreement', {}),
                user_preferences=user_preferences
            )
            
            if purchase_response.success and purchase_data:
                package.purchase_agreement = PurchaseAgreement(**purchase_data)
            
            # Generate pre-approval letter if needed
            if offer_params.get('include_preapproval', True):
                preapproval_response, preapproval_data = OfferService.generate_document(
                    user_id=user_id,
                    section_type="preapproval",
                    property_address=property_address,
                    params=offer_params.get('preapproval', {}),
                    user_preferences=user_preferences
                )
                
                if preapproval_response.success and preapproval_data:
                    package.pre_approval_letter = PreApprovalLetter(**preapproval_data)
            
            # Generate earnest money instructions if needed
            if offer_params.get('include_earnest_money', True):
                earnest_response, earnest_data = OfferService.generate_document(
                    user_id=user_id,
                    section_type="earnest_money",
                    property_address=property_address,
                    params=offer_params.get('earnest_money', {}),
                    user_preferences=user_preferences
                )
                
                if earnest_response.success and earnest_data:
                    package.earnest_money_instructions = EarnestMoneyInstructions(**earnest_data)
            
            # Generate cover letter if requested
            if offer_params.get('include_cover_letter', False):
                cover_response, cover_data = OfferService.generate_document(
                    user_id=user_id,
                    section_type="buyer_letter",
                    property_address=property_address,
                    params=offer_params.get('cover_letter', {}),
                    user_preferences=user_preferences
                )
                
                if cover_response.success and cover_data:
                    package.cover_letter = CoverLetter(**cover_data)
            
            # Update package status based on generated documents
            if package.is_ready_to_submit():
                package.status = "ready"
            else:
                package.status = "draft"
            
            logger.info(f"✅ Complete offer package generated: {package.package_id}")
            logger.info(f"📋 Included documents: {package.get_included_documents()}")
            
            return package
            
        except Exception as e:
            logger.error(f"❌ Failed to generate complete offer package: {str(e)}")
            raise
    
    @staticmethod
    def get_user_offer_packages(user_id: str) -> List[Dict[str, Any]]:
        """
        Get all offer packages for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List of offer package summaries
        """
        try:
            # Query PDF documents for offer-related documents
            offer_docs = PDFDocument.query.filter(
                PDFDocument.user_id == user_id,
                PDFDocument.document_type.in_([
                    'purchase_agreement',
                    'pre_approval_letter', 
                    'earnest_money_instructions',
                    'cover_letter'
                ])
            ).order_by(PDFDocument.created_at.desc()).all()
            
            # Group documents by property/date to reconstruct packages
            packages = {}
            for doc in offer_docs:
                # Simple grouping by date (in production, use proper package tracking)
                date_key = doc.created_at.date().isoformat()
                if date_key not in packages:
                    packages[date_key] = {
                        'package_id': f"pkg_{date_key}_{user_id[:8]}",
                        'created_at': doc.created_at.isoformat(),
                        'status': 'generated',
                        'documents': []
                    }
                
                packages[date_key]['documents'].append({
                    'document_id': doc.id,
                    'document_type': doc.document_type,
                    'filename': doc.filename,
                    'status': doc.status,
                    'created_at': doc.created_at.isoformat()
                })
            
            logger.info(f"📋 Retrieved {len(packages)} offer packages for user {user_id}")
            return list(packages.values())
            
        except Exception as e:
            logger.error(f"❌ Failed to get user offer packages: {str(e)}")
            return []
    
    @staticmethod
    def validate_offer_package(package: OfferPackage) -> Tuple[bool, List[str]]:
        """
        Validate an offer package for completeness and correctness.
        
        Args:
            package: OfferPackage to validate
            
        Returns:
            Tuple of (is_valid, list_of_issues)
        """
        issues = []
        
        try:
            # Check for required purchase agreement
            if not package.purchase_agreement:
                issues.append("Purchase agreement is required")
            elif package.purchase_agreement.send_decision.action != OfferDecisionAction.SEND:
                issues.append("Purchase agreement is not set to send")
            
            # Check for financing documentation
            has_financing_doc = False
            if package.pre_approval_letter:
                if package.pre_approval_letter.decision.action != PreApprovalAction.DONT_SEND:
                    has_financing_doc = True
            
            # Assume cash offer if offer price is very high relative to typical financing
            # (This is a simplified check - in production, use more sophisticated logic)
            if package.purchase_agreement and package.purchase_agreement.offer_price_usd > 0:
                if not has_financing_doc and package.purchase_agreement.offer_price_usd < 1000000:
                    issues.append("Financing documentation required for non-cash offers")
            
            # Check property address completeness
            if not package.property_address.line1 or not package.property_address.city:
                issues.append("Property address is incomplete")
            
            # Validate earnest money if included
            if package.earnest_money_instructions:
                if package.earnest_money_instructions.decision.action == EarnestMoneyAction.INCLUDE_INSTRUCTIONS:
                    if package.earnest_money_instructions.amount_usd <= 0:
                        issues.append("Earnest money amount must be greater than 0")
            
            is_valid = len(issues) == 0
            
            logger.info(f"📋 Offer package validation: {'✅ Valid' if is_valid else '❌ Invalid'}")
            if issues:
                logger.info(f"🔍 Validation issues: {issues}")
            
            return is_valid, issues
            
        except Exception as e:
            logger.error(f"❌ Error validating offer package: {str(e)}")
            return False, [f"Validation error: {str(e)}"]
    
    @staticmethod
    def get_offer_document_url(document_id: str, user_id: str) -> Optional[str]:
        """
        Get a presigned URL for downloading an offer document.
        
        Args:
            document_id: ID of the document
            user_id: ID of the user (for authorization)
            
        Returns:
            Presigned URL or None if not found/unauthorized
        """
        try:
            # Find the document
            doc = PDFDocument.query.filter(
                PDFDocument.id == document_id,
                PDFDocument.user_id == user_id
            ).first()
            
            if not doc:
                logger.warning(f"❌ Document {document_id} not found for user {user_id}")
                return None
            
            # Generate presigned URL
            url = s3_service.generate_presigned_url(
                doc.file_path,
                download_filename=doc.filename
            )
            
            logger.info(f"🔗 Generated presigned URL for document {document_id}")
            return url
            
        except Exception as e:
            logger.error(f"❌ Failed to generate document URL: {str(e)}")
            return None


# ==================== UTILITY FUNCTIONS ====================

def parse_property_address(address_string: str) -> PropertyAddress:
    """
    Parse a property address string into structured components.
    
    Args:
        address_string: Raw address string
        
    Returns:
        PropertyAddress: Structured address object
    """
    # Simplified parsing - in production, use a proper address validation service
    parts = address_string.split(', ')
    
    if len(parts) >= 3:
        line1 = parts[0]
        city = parts[-2] if len(parts) > 3 else parts[-1].split(' ')[0]
        state_zip = parts[-1].split(' ')
        state = state_zip[-2] if len(state_zip) >= 2 else ""
        postal_code = state_zip[-1] if len(state_zip) >= 1 else ""
        line2 = ', '.join(parts[1:-2]) if len(parts) > 3 else None
    else:
        line1 = address_string
        line2 = city = state = postal_code = ""
    
    return PropertyAddress(
        line1=line1,
        line2=line2 if line2 else None,
        city=city,
        state=state,
        postal_code=postal_code
    )


def format_currency(amount: int) -> str:
    """Format currency amount for display."""
    return f"${amount:,}"


def get_document_type_display_name(doc_type: DocumentType) -> str:
    """Get human-readable display name for document type."""
    display_names = {
        DocumentType.PURCHASE_AGREEMENT: "Purchase Agreement",
        DocumentType.PRE_APPROVAL_LETTER: "Pre-Approval Letter",
        DocumentType.EARNEST_MONEY_INSTRUCTIONS: "Earnest Money Instructions",
        DocumentType.COVER_LETTER: "Cover Letter"
    }
    return display_names.get(doc_type, doc_type.value.replace('_', ' ').title())
