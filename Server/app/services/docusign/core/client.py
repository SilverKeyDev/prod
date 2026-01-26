"""
DocuSign API client

Low-level DocuSign API client wrapper.
"""

from typing import Optional, Dict, Any, List
from flask import current_app

from docusign_esign import (
    ApiClient,
    EnvelopesApi,
    TemplatesApi,
    EnvelopeDefinition,
    RecipientViewRequest,
    ReturnUrlRequest
)
from docusign_esign.client.api_exception import ApiException

from logger import get_logger, LOG_CATEGORIES
from ..errors import DocusignAPIError, DocusignAuthError
from .auth_jwt import get_jwt_auth
from .auth_oauth import DocusignOAuthService


logger = get_logger()


class DocusignClient:
    """
    Low-level DocuSign API client.
    
    Supports both JWT (service account) and OAuth (per-user) authentication.
    """
    
    def __init__(self, auth_type: str = 'jwt', user_id: Optional[str] = None):
        """
        Initialize DocuSign client.
        
        Args:
            auth_type: 'jwt' or 'oauth'
            user_id: Required if auth_type is 'oauth'
        """
        self.auth_type = auth_type
        self.user_id = user_id
        
        logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Initializing DocuSign client", {
            "auth_type": auth_type,
            "user_id": user_id
        })
        
        if auth_type == 'jwt':
            self.jwt_auth = get_jwt_auth()
            self.api_client = self.jwt_auth.get_api_client()
            self.account_id = self.jwt_auth.get_account_id()
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign client initialized with JWT", {
                "account_id": self.account_id
            })
        elif auth_type == 'oauth':
            if not user_id:
                raise DocusignAuthError("user_id required for OAuth authentication")
            
            self.api_client = DocusignOAuthService.get_api_client(user_id)
            if not self.api_client:
                raise DocusignAuthError(f"User {user_id} not connected to DocuSign")
            
            token = DocusignOAuthService.get_valid_token(user_id)
            self.account_id = token.account_id if token else None
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign client initialized with OAuth", {
                "user_id": user_id,
                "account_id": self.account_id
            })
        else:
            raise ValueError(f"Invalid auth_type: {auth_type}")
        
        if not self.account_id:
            raise DocusignAuthError("DocuSign account ID not available")
    
    def _handle_api_exception(self, e: ApiException, operation: str):
        """Handle DocuSign API exception"""
        logger.error(LOG_CATEGORIES["ERRORS"], f"DocuSign API error: {operation}", {
            "operation": operation,
            "status": e.status,
            "reason": e.reason,
            "body": e.body,
            "auth_type": self.auth_type,
            "account_id": self.account_id
        })
        
        raise DocusignAPIError(
            f"DocuSign {operation} failed: {e.reason}",
            status_code=e.status,
            response_body=e.body
        )
    
    # Envelope operations
    
    def create_envelope(self, envelope_definition: EnvelopeDefinition) -> Dict[str, Any]:
        """
        Create envelope in DocuSign.
        
        Args:
            envelope_definition: EnvelopeDefinition object
            
        Returns:
            Envelope response dictionary
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating DocuSign envelope", {
                "account_id": self.account_id,
                "auth_type": self.auth_type,
                "document_count": len(envelope_definition.documents) if envelope_definition.documents else 0,
                "email_subject": envelope_definition.email_subject
            })
            
            envelopes_api = EnvelopesApi(self.api_client)
            results = envelopes_api.create_envelope(
                account_id=self.account_id,
                envelope_definition=envelope_definition
            )
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "DocuSign envelope created successfully", {
                "envelope_id": results.envelope_id,
                "status": results.status,
                "account_id": self.account_id
            })
            
            return {
                'envelopeId': results.envelope_id,
                'status': results.status,
                'statusDateTime': results.status_date_time
            }
            
        except ApiException as e:
            self._handle_api_exception(e, "create envelope")
    
    def get_envelope(self, envelope_id: str) -> Dict[str, Any]:
        """
        Get envelope status and details.
        
        Args:
            envelope_id: Envelope ID
            
        Returns:
            Envelope details
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Getting envelope status", {
                "envelope_id": envelope_id,
                "account_id": self.account_id
            })
            
            envelopes_api = EnvelopesApi(self.api_client)
            envelope = envelopes_api.get_envelope(
                account_id=self.account_id,
                envelope_id=envelope_id
            )
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Envelope status retrieved", {
                "envelope_id": envelope_id,
                "status": envelope.status
            })
            
            return {
                'envelopeId': envelope.envelope_id,
                'status': envelope.status,
                'statusDateTime': envelope.status_date_time,
                'sentDateTime': envelope.sent_date_time,
                'completedDateTime': envelope.completed_date_time,
                'voidedDateTime': envelope.voided_date_time,
            }
            
        except ApiException as e:
            self._handle_api_exception(e, "get envelope")
    
    def void_envelope(self, envelope_id: str, reason: str) -> Dict[str, Any]:
        """
        Void an envelope.
        
        Args:
            envelope_id: Envelope ID
            reason: Void reason
            
        Returns:
            Updated envelope details
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Voiding envelope", {
                "envelope_id": envelope_id,
                "reason": reason,
                "account_id": self.account_id
            })
            
            from docusign_esign import Envelope
            
            envelopes_api = EnvelopesApi(self.api_client)
            envelope = Envelope(status='voided', voided_reason=reason)
            
            results = envelopes_api.update(
                account_id=self.account_id,
                envelope_id=envelope_id,
                envelope=envelope
            )
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Envelope voided successfully", {
                "envelope_id": envelope_id,
                "reason": reason
            })
            
            return {
                'envelopeId': results.envelope_id,
                'status': results.status
            }
            
        except ApiException as e:
            self._handle_api_exception(e, "void envelope")
    
    def create_recipient_view(self, envelope_id: str, recipient: Dict[str, Any], return_url: str) -> str:
        """
        Create embedded signing URL for recipient.
        
        Args:
            envelope_id: Envelope ID
            recipient: Recipient details
            return_url: Return URL after signing
            
        Returns:
            Signing URL
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating recipient view", {
                "envelope_id": envelope_id,
                "recipient_email": recipient.get('email'),
                "recipient_id": recipient.get('recipientId'),
                "account_id": self.account_id
            })
            
            view_request = RecipientViewRequest(
                authentication_method='none',
                client_user_id=recipient.get('clientUserId', recipient['recipientId']),
                recipient_id=recipient['recipientId'],
                return_url=return_url,
                user_name=recipient['name'],
                email=recipient['email']
            )
            
            envelopes_api = EnvelopesApi(self.api_client)
            results = envelopes_api.create_recipient_view(
                account_id=self.account_id,
                envelope_id=envelope_id,
                recipient_view_request=view_request
            )
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Recipient view created successfully", {
                "envelope_id": envelope_id,
                "recipient_email": recipient.get('email')
            })
            
            return results.url
            
        except ApiException as e:
            self._handle_api_exception(e, "create recipient view")
    
    def get_sender_view(self, envelope_id: str, return_url: str) -> str:
        """
        Create sender/correction view URL.
        
        Args:
            envelope_id: Envelope ID
            return_url: Return URL
            
        Returns:
            Sender view URL
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Creating sender view", {
                "envelope_id": envelope_id,
                "account_id": self.account_id
            })
            
            view_request = ReturnUrlRequest(return_url=return_url)
            
            envelopes_api = EnvelopesApi(self.api_client)
            results = envelopes_api.create_sender_view(
                account_id=self.account_id,
                envelope_id=envelope_id,
                return_url_request=view_request
            )
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Sender view created successfully", {
                "envelope_id": envelope_id
            })
            
            return results.url
            
        except ApiException as e:
            self._handle_api_exception(e, "create sender view")
    
    def get_envelope_documents(self, envelope_id: str) -> Dict[str, Any]:
        """
        Get envelope documents (combined PDF).
        
        Args:
            envelope_id: Envelope ID
            
        Returns:
            Documents data
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Fetching envelope documents", {
                "envelope_id": envelope_id,
                "account_id": self.account_id
            })
            
            envelopes_api = EnvelopesApi(self.api_client)
            
            # Get combined PDF (document ID = 'combined')
            pdf_bytes = envelopes_api.get_document(
                account_id=self.account_id,
                envelope_id=envelope_id,
                document_id='combined'
            )
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Envelope documents fetched successfully", {
                "envelope_id": envelope_id,
                "size_bytes": len(pdf_bytes),
                "size_kb": len(pdf_bytes) / 1024
            })
            
            return {
                'combined_pdf': pdf_bytes,
                'envelope_id': envelope_id
            }
            
        except ApiException as e:
            self._handle_api_exception(e, "get envelope documents")
    
    def get_envelope_certificate(self, envelope_id: str) -> Dict[str, Any]:
        """
        Get certificate of completion.
        
        Args:
            envelope_id: Envelope ID
            
        Returns:
            Certificate data
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Fetching envelope certificate", {
                "envelope_id": envelope_id,
                "account_id": self.account_id
            })
            
            envelopes_api = EnvelopesApi(self.api_client)
            
            # Get certificate (document ID = 'certificate')
            cert_bytes = envelopes_api.get_document(
                account_id=self.account_id,
                envelope_id=envelope_id,
                document_id='certificate'
            )
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Envelope certificate fetched successfully", {
                "envelope_id": envelope_id,
                "size_bytes": len(cert_bytes),
                "size_kb": len(cert_bytes) / 1024
            })
            
            return {
                'pdf': cert_bytes,
                'envelope_id': envelope_id
            }
            
        except ApiException as e:
            self._handle_api_exception(e, "get envelope certificate")
    
    # Template operations
    
    def list_templates(self) -> List[Dict[str, Any]]:
        """
        List available templates.
        
        Returns:
            List of templates
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Listing DocuSign templates", {
                "account_id": self.account_id
            })
            
            templates_api = TemplatesApi(self.api_client)
            results = templates_api.list_templates(account_id=self.account_id)
            
            templates = []
            if results.envelope_templates:
                for tmpl in results.envelope_templates:
                    templates.append({
                        'templateId': tmpl.template_id,
                        'name': tmpl.name,
                        'description': tmpl.description,
                        'shared': tmpl.shared,
                        'created': tmpl.created
                    })
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Templates listed successfully", {
                "count": len(templates),
                "account_id": self.account_id
            })
            
            return templates
            
        except ApiException as e:
            self._handle_api_exception(e, "list templates")
    
    def get_template(self, template_id: str) -> Dict[str, Any]:
        """
        Get template details.
        
        Args:
            template_id: Template ID
            
        Returns:
            Template details
        """
        try:
            logger.debug(LOG_CATEGORIES["DOCUSIGN"], "Getting template details", {
                "template_id": template_id,
                "account_id": self.account_id
            })
            
            templates_api = TemplatesApi(self.api_client)
            template = templates_api.get(
                account_id=self.account_id,
                template_id=template_id
            )
            
            logger.info(LOG_CATEGORIES["DOCUSIGN"], "Template details retrieved", {
                "template_id": template_id,
                "template_name": template.name
            })
            
            return {
                'templateId': template.template_id,
                'name': template.name,
                'description': template.description,
                'shared': template.shared
            }
            
        except ApiException as e:
            self._handle_api_exception(e, "get template")
