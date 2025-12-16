from app.celery.celery_worker import celery
from flask import current_app
from app.services.research.report_generator import generate_report
from app.models.pdf_document import PDFDocument
from app.models.user_preferences import UserPreferences
from app import db
import traceback
import json
import time
from sqlalchemy.exc import OperationalError, DisconnectionError


@celery.task(name="tasks.generate_report_async")
def generate_report_async(address, comparison_address, filename, document_id, user_id, marketing_model=False):
    """Asynchronously generate a property report with robust DB session management"""
    try:        
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
                    user_prefs = UserPreferences.query.filter_by(user_id=user_id).first()
                    if user_prefs:
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

                    
                    # Dispose engine before database operations for better reliability
                    try:
                        db.engine.dispose()
                    except Exception as e:
                        current_app.logger.warning(f"⚠️ Failed to dispose engine in Celery task: {str(e)}")
                    
                    # Commit everything with retry logic
                    max_retries = 3
                    retry_delay = 1
                    
                    for attempt in range(max_retries):
                        try:
                            db.session.commit()

                            break  # Success, exit retry loop
                        except (OperationalError, DisconnectionError) as e:
                            current_app.logger.warning(f"🔄 Celery DB commit error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                            
                            # Clean up session
                            try:
                                db.session.rollback()
                                db.session.remove()
                            except Exception:
                                pass
                            
                            # Dispose engine to force reconnection
                            try:
                                db.engine.dispose()
                            except Exception:
                                pass
                            
                            if attempt < max_retries - 1:
                                time.sleep(retry_delay)
                                retry_delay *= 2  # Exponential backoff
                            else:
                                current_app.logger.error(f"❌ Max retries exceeded for Celery DB commit")
                                raise
                        except Exception as e:
                            current_app.logger.error(f"❌ Non-connection error in Celery DB commit: {str(e)}")
                            try:
                                db.session.rollback()
                            except Exception:
                                pass
                            raise

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

        # Attempt best-effort recovery update to DB with reliability improvements
        try:
            with current_app.app_context():
                # Dispose engine before error recovery operation
                try:
                    db.engine.dispose()
                except Exception as e:
                    current_app.logger.warning(f"⚠️ Failed to dispose engine in error recovery: {str(e)}")
                
                pdf_doc = db.session.get(PDFDocument, document_id)
                if pdf_doc:
                    pdf_doc.status = 'error'
                    
                    # Error recovery commit with retry logic
                    max_retries = 3
                    retry_delay = 1
                    
                    for attempt in range(max_retries):
                        try:
                            db.session.commit()
                            current_app.logger.info(f"📝 Updated status to 'error' for document_id: {document_id}")
                            break  # Success, exit retry loop
                        except (OperationalError, DisconnectionError) as e:
                            current_app.logger.warning(f"🔄 Error recovery DB commit error on attempt {attempt + 1}/{max_retries}: {str(e)}")
                            
                            # Clean up session
                            try:
                                db.session.rollback()
                                db.session.remove()
                            except Exception:
                                pass
                            
                            # Dispose engine to force reconnection
                            try:
                                db.engine.dispose()
                            except Exception:
                                pass
                            
                            if attempt < max_retries - 1:
                                time.sleep(retry_delay)
                                retry_delay *= 2  # Exponential backoff
                            else:
                                current_app.logger.error(f"❌ Max retries exceeded for error recovery DB commit")
                                raise
                        except Exception as e:
                            current_app.logger.error(f"❌ Non-connection error in error recovery DB commit: {str(e)}")
                            try:
                                db.session.rollback()
                            except Exception:
                                pass
                            raise
        except Exception as fail_update_error:
            current_app.logger.error(f"❌ Failed to update error status: {str(fail_update_error)}")
            try:
                db.session.rollback()
            except Exception:
                pass
        finally:
            db.session.remove()

        return {'success': False, 'error': str(e), 'document_id': document_id}


# Home Matching Tasks
@celery.task(name="tasks.find_best_matches_task", bind=True)
def find_best_matches_task(self, user_data, homes_data, top_k=10, include_explanations=False, method_weights=None, embedding_provider="sentence_transformer", llm_provider="openai"):
    """
    Celery task to find the best home matches for a user.
    
    Args:
        user_data: User preferences and profile data
        homes_data: List of home listings to match against
        top_k: Number of top matches to return
        include_explanations: Whether to include LLM explanations
        method_weights: Custom weights for ensemble methods
        embedding_provider: Embedding model provider
        llm_provider: LLM provider
    
    Returns:
        List of top-k home matches with scores and explanations
    """
    try:
        
        # Update task progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Initializing home matching system', 'progress': 10}
        )
        
        # Import the home matching function
        from ..home_matching.app.match import find_best_matches
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Finding best matches', 'progress': 50}
        )
        
        # Call the home matching function
        matches = find_best_matches(
            user_data=user_data,
            homes_data=homes_data,
            top_k=top_k,
            include_explanations=include_explanations,
            method_weights=method_weights,
            embedding_provider=embedding_provider,
            llm_provider=llm_provider
        )
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'status': 'Finalizing results', 'progress': 90}
        )
                
        return {
            'success': True,
            'matches': matches,
            'user_id': user_data.get('user_id'),
            'homes_processed': len(homes_data),
            'matches_found': len(matches),
            'top_k': top_k,
            'include_explanations': include_explanations
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'user_id': user_data.get('user_id', 'unknown')
        }