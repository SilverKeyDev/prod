from app.celery.celery_worker import celery
from flask import current_app
from app.services.report_generator import generate_report
from app.models.pdf_document import PDFDocument
from app.models.user_preferences import UserPreferences
from app import db
import traceback
from flask import current_app as app
import json


@celery.task(name="tasks.example_task")
def example_task():
    print(f"Secret key is: {current_app.config['SECRET_KEY']}")
    return "Done"

@celery.task(name="tasks.generate_report_async")
def generate_report_async(address, filename, document_id, user_id):
    """Asynchronously generate a property report"""
    try:
        # Generate the report
        result_data = generate_report(address, filename, user_id)
        
        # Update PDF document record and user preferences
        with current_app.app_context():
            pdf_doc = PDFDocument.query.get(document_id)
            if pdf_doc:
                pdf_doc.status = 'processed'
                pdf_doc.file_size = len(str(result_data).encode('utf-8'))
                
                # Update user preferences for solo report creation
                try:
                    user_prefs = UserPreferences.query.filter_by(user_id=user_id).first()
                    if user_prefs:
                        # Increment solo_reports_created
                        user_prefs.solo_reports_created = (user_prefs.solo_reports_created or 0) + 1
                        
                        # Add address to solo_reports_addresses
                        current_addresses = []
                        if user_prefs.solo_reports_addresses:
                            try:
                                current_addresses = json.loads(user_prefs.solo_reports_addresses)
                            except (json.JSONDecodeError, TypeError):
                                current_addresses = []
                        
                        # Add the new address if it's not already in the list
                        if address not in current_addresses:
                            current_addresses.append(address)
                        
                        user_prefs.solo_reports_addresses = json.dumps(current_addresses)
                        
                        current_app.logger.info(f"📊 Updated user preferences for user {user_id}: solo_reports_created={user_prefs.solo_reports_created}, addresses_count={len(current_addresses)}")
                    else:
                        current_app.logger.warning(f"⚠️ No user preferences found for user {user_id}")
                except Exception as pref_error:
                    current_app.logger.error(f"❌ Failed to update user preferences: {str(pref_error)}")
                
                db.session.commit()
            logger = current_app.logger
            logger.info(f"🔍 Raw JSON response:\n{json.dumps(result_data, indent=2)}")
        return {'success': True, 'result': result_data, 'document_id': document_id}
        
    except Exception as e:
        # Update status to error
        try:
            with current_app.app_context():
                pdf_doc = PDFDocument.query.get(document_id)
                if pdf_doc:
                    pdf_doc.status = 'error'
                    db.session.commit()
        except:
            pass
        
        return {'success': False, 'error': str(e), 'document_id': document_id}