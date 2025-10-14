from datetime import datetime
import uuid
from app import db
import json

class UserPreferences(db.Model):
    """Comprehensive user preferences and behavioral data model for AI agents"""
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)

    # === METADATA ===
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    solo_reports_created = db.Column(db.Integer, default=0)
    solo_reports_addresses = db.Column(db.Text)  # JSON array of addresses
    group_reports_created = db.Column(db.Integer, default=0)
    group_reports_addresses = db.Column(db.Text)  # JSON array of addresses
    chat_sessions = db.Column(db.Text)  # JSON array of sentiments
    preferences_version = db.Column(db.String(10), default='1.0')
    last_updated_section = db.Column(db.String(50))
    data_sources = db.Column(db.Text)  # JSON array of data sources
    
    # === Demographics ===
    age = db.Column(db.Integer)
    gender = db.Column(db.String(50))
    occupation = db.Column(db.String(100))
    pets = db.Column(db.String(100))

    # === Financial ===
    gross_income = db.Column(db.Float)
    home_budget_min = db.Column(db.Float)
    home_budget_max = db.Column(db.Float)
    credit_score_range = db.Column(db.String(20))
    down_payment = db.Column(db.Float)
    ideal_zip_code = db.Column(db.String(10))

    # === Home Buying Process ===
    housing_type = db.Column(db.String(100))
    preferred_bathrooms = db.Column(db.Integer)
    preferred_bedrooms = db.Column(db.Integer)
    preferred_lot_size = db.Column(db.String(50))
    preferred_home_age = db.Column(db.String(50))
    preferred_architectural_style = db.Column(db.String(100))
    renovation_preference = db.Column(db.String(100))
    architectural_style_preference = db.Column(db.String(100))
    intended_property_use = db.Column(db.String(100))
    preferred_home_features = db.Column(db.Text)  # JSON stringified list
    deal_breakers = db.Column(db.Text)  # JSON stringified list

    # === Location & Housing ===
    important_locations = db.Column(db.Text)  # JSON stringified list of { name, address, commute_tolerance }
    walkability_importance = db.Column(db.String(50))

    # === Communication ===
    communication_frequency = db.Column(db.String(50))
    information_detail_level = db.Column(db.String(50))
    has_buyers_agent = db.Column(db.String(10))  # 'yes' or 'no'
    looking_for_buyers_agent = db.Column(db.Boolean)

    # === Report Customization ===
    report_section_priorities = db.Column(db.Text)  # JSON stringified list
   
    
    # === PERSONALIZATION INSIGHTS (AI) ===
    content_feedback_log = db.Column(db.Text)  # JSON of how they rated or reacted to prior reports
    agent_interaction_history = db.Column(db.Text)  # JSON list of touchpoints or agent name → type → feedback
    personality_insights = db.Column(db.Text)  # JSON with MBTI or Big 5 profile extracted from responses
    additional_context = db.Column(db.Text)  # Additional context or notes from user
    
    
    # === REPORT CUSTOMIZATION ===
    report_section_priorities = db.Column(db.Text)  # JSON array of section keys in priority order
    
    # Relationship
    user = db.relationship('User', back_populates='user_preferences', lazy='select')
    
    def __init__(self, **kwargs):
        super(UserPreferences, self).__init__(**kwargs)
        if not self.id:
            self.id = str(uuid.uuid4())

    def _parse_json_field(self, field_value):
        """Helper method to parse JSON fields safely"""
        if field_value is None:
            return None
        try:
            return json.loads(field_value)
        except (json.JSONDecodeError, TypeError):
            return field_value

    def to_dict(self):
        return {
        # Demographics
        'pets': self.pets,
        'age': self.age,
        'gender': self.gender,
        'occupation': self.occupation,

        # Financial
        'gross_income': self.gross_income,
        'home_budget_min': self.home_budget_min,
        'home_budget_max': self.home_budget_max,
        'credit_score_range': self.credit_score_range,
        'down_payment': self.down_payment,
        'ideal_zip_code': self.ideal_zip_code,

        # Home Buying Process
        'preferred_housing_type': self.housing_type,  # model uses housing_type
        'preferred_bathrooms': self.preferred_bathrooms,
        'preferred_bedrooms': self.preferred_bedrooms,
        'preferred_lot_size': self.preferred_lot_size,
        'preferred_home_age': self.preferred_home_age,
        'preferred_architectural_style': self.preferred_architectural_style,
        'preferred_home_features': self._parse_json_field(self.preferred_home_features),
        'renovation_preference': self.renovation_preference,
        'intended_property_use': self.intended_property_use,
        'architectural_style_preference': self.architectural_style_preference,
        'deal_breakers': self._parse_json_field(self.deal_breakers),

        # Location & Housing
        'important_locations': self._parse_json_field(self.important_locations),
        'walkability_importance': self.walkability_importance,

        # Communication
        'communication_frequency': self.communication_frequency,
        'information_detail_level': self.information_detail_level,
        'has_buyers_agent': self.has_buyers_agent,
        'looking_for_buyers_agent': self.looking_for_buyers_agent,

        # Report Customization
        'report_section_priorities': self._parse_json_field(self.report_section_priorities),

        # Metadata
        'created_at': self.created_at.isoformat() if self.created_at else None,
        'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        'solo_reports_created': self.solo_reports_created,
        'solo_reports_addresses': self._parse_json_field(self.solo_reports_addresses),
        'group_reports_created': self.group_reports_created,
        'group_reports_addresses': self._parse_json_field(self.group_reports_addresses),
        'chat_sessions': self._parse_json_field(self.chat_sessions),
        'preferences_version': self.preferences_version,
        'last_updated_section': self.last_updated_section,
        'data_sources': self._parse_json_field(self.data_sources),

        # Personalization Insights (AI)
        'content_feedback_log': self._parse_json_field(self.content_feedback_log),
        'agent_interaction_history': self._parse_json_field(self.agent_interaction_history),
        'personality_insights': self._parse_json_field(self.personality_insights),
        'additional_context': self.additional_context
    }

 

    def update_section(self, section_data, section_name):
        """Update a specific section of preferences"""
        for key, value in section_data.items():
            if hasattr(self, key):
                if isinstance(value, (list, dict)):
                    setattr(self, key, json.dumps(value))
                else:
                    setattr(self, key, value)
        self.last_updated_section = section_name
        self.updated_at = datetime.utcnow()

    def __repr__(self):
        return f'<UserPreferences {self.user_id} - {self.get_profile_completeness()}% complete>'
