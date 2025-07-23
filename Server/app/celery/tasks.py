from app.celery.celery_worker import celery
from flask import current_app
from app.services.report_generator import generate_report
from app.models.pdf_document import PDFDocument
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
        result_data = generate_report(address, filename)
        
        # Update PDF document record
        with current_app.app_context():
            pdf_doc = PDFDocument.query.get(document_id)
            if pdf_doc:
                pdf_doc.status = 'processed'
                pdf_doc.file_size = len(str(result_data).encode('utf-8'))
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