from datetime import datetime

class User:
    def __init__(self, id, username, email, password_hash):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.is_active = True
        self.last_login = None

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
            'isActive': self.is_active,
            'lastLogin': self.last_login.isoformat() if self.last_login else None
        }

class PDFDocument:
    def __init__(self, id, filename, path, user_id):
        self.id = id
        self.filename = filename
        self.path = path
        self.user_id = user_id
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.status = 'pending'
        self.page_count = None
        self.word_count = None
        self.processing_progress = 0
        self.ai_analysis = []

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
            'status': self.status,
            'pageCount': self.page_count,
            'wordCount': self.word_count,
            'processingProgress': self.processing_progress,
            'aiAnalysis': [analysis.to_dict() for analysis in self.ai_analysis]
        }

class AIAgentAnalysis:
    def __init__(self, id, document_id, analysis_type, analysis_data):
        self.id = id
        self.document_id = document_id
        self.analysis_type = analysis_type
        self.analysis_data = analysis_data
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.status = 'pending'
        self.progress = 0

    def to_dict(self):
        return {
            'id': self.id,
            'analysisType': self.analysis_type,
            'data': self.analysis_data,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
            'status': self.status,
            'progress': self.progress
        }

class Property:
    def __init__(self, id, address, notes=None):
        self.id = id
        self.address = address
        self.notes = notes
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.reports = []

    def to_dict(self):
        return {
            'id': self.id,
            'address': self.address,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }

class Report:
    def __init__(self, id, address, notes=None, status='generating', report_data=None):
        self.id = id
        self.address = address
        self.notes = notes
        self.status = status
        self.report_data = report_data
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'address': self.address,
            'notes': self.notes,
            'status': self.status,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
            'reportData': self.report_data
        }