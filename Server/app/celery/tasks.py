from app.celery.celery_worker import celery
from flask import current_app
from app.services.report_generator import generate_report
from app.models.pdf_document import PDFDocument
from app.models.user_preferences import UserPreferences
from app import db
import traceback
import json


@celery.task(name="tasks.generate_report_async")
def generate_report_async(address, comparison_address, filename, document_id, user_id, marketing_model=False):
    """Asynchronously generate a property report with robust DB session management"""
    try:
        current_app.logger.info(f"🔧 CELERY TASK: Starting report generation with user_id: {user_id}")
        current_app.logger.info(f"📍 Task parameters: address='{address}', comparison_address='{comparison_address}', filename='{filename}', marketing_model={marketing_model}")
        
        # Generate the report (this does not depend on db.session)
        result_data = generate_report(address, comparison_address, filename, user_id, marketing_model)

        # Use a fresh app context and db session for all database operations
        with current_app.app_context():
            try:
                pdf_doc = db.session.get(PDFDocument, document_id)
                if pdf_doc:
                    pdf_doc.status = 'processed'
                    pdf_doc.file_size = len(str(result_data).encode('utf-8'))

                    # Handle user preferences
                    current_app.logger.info(f"🔍 CELERY TASK: Looking up preferences for user_id: {user_id}")
                    user_prefs = UserPreferences.query.filter_by(user_id=user_id).first()
                    if user_prefs:
                        current_app.logger.info(f"✅ CELERY TASK: Found preferences for user_id: {user_id}")
                        user_prefs.solo_reports_created = (user_prefs.solo_reports_created or 0) + 1

                        # Maintain unique addresses
                        current_addresses = []
                        if user_prefs.solo_reports_addresses:
                            try:
                                current_addresses = json.loads(user_prefs.solo_reports_addresses)
                            except (json.JSONDecodeError, TypeError):
                                pass  # Treat as empty

                        if address not in current_addresses:
                            current_addresses.append(address)

                        user_prefs.solo_reports_addresses = json.dumps(current_addresses)

                        current_app.logger.info(
                            f"📊 CELERY TASK: Updated user preferences for user_id {user_id}: "
                            f"solo_reports_created={user_prefs.solo_reports_created}, "
                            f"addresses_count={len(current_addresses)}"
                        )
                    else:
                        current_app.logger.warning(f"⚠️ CELERY TASK: No user preferences found for user_id {user_id}")

                    # Commit everything
                    db.session.commit()
                    current_app.logger.info(
                        f"✅ Successfully updated PDF document status to 'processed' for document_id: {document_id}"
                    )
                    current_app.logger.info(f"🔍 Raw JSON response:\n{json.dumps(result_data, indent=2)}")

            except Exception as db_error:
                current_app.logger.error(f"❌ DB error in Celery task: {str(db_error)}")
                current_app.logger.error(traceback.format_exc())
                db.session.rollback()
                raise

            finally:
                db.session.remove()

        return {'success': True, 'result': result_data, 'document_id': document_id}

    except Exception as e:
        current_app.logger.error(f"❌ Celery task failed: {str(e)}")
        current_app.logger.error(traceback.format_exc())

        # Attempt best-effort recovery update to DB
        try:
            with current_app.app_context():
                pdf_doc = db.session.get(PDFDocument, document_id)
                if pdf_doc:
                    pdf_doc.status = 'error'
                    db.session.commit()
                    current_app.logger.info(f"📝 Updated status to 'error' for document_id: {document_id}")
        except Exception as fail_update_error:
            current_app.logger.error(f"❌ Failed to update error status: {str(fail_update_error)}")
            db.session.rollback()
        finally:
            db.session.remove()

        return {'success': False, 'error': str(e), 'document_id': document_id}