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
    chat_sessions = db.Column(db.Text)  # JSON array of addresses
    preferences_version = db.Column(db.String(10), default='1.0')
    last_updated_section = db.Column(db.String(50))
    data_sources = db.Column(db.Text)  # JSON array of data sources
    

    # === DEMOGRAPHIC INFORMATION ===
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))  # male, female, non-binary, prefer_not_to_say
    marital_status = db.Column(db.String(20))  # single, married, divorced, widowed, partnered
    household_size = db.Column(db.Integer)
    children_count = db.Column(db.Integer, default=0)
    children_ages = db.Column(db.Text)  # JSON array of ages
    education_level = db.Column(db.String(50))  # high_school, bachelors, masters, phd, trade_school
    occupation = db.Column(db.String(100))
    industry = db.Column(db.String(100))
    employment_status = db.Column(db.String(30))  # employed, unemployed, retired, student, freelance
    
    # === FINANCIAL PROFILE ===
    income_range = db.Column(db.String(30))  # <25k, 25k-50k, 50k-75k, 75k-100k, 100k-150k, 150k+
    preferred_home_price_range = db.Column(db.String(30))  # <25k, 25k-50k, 50k-75k, 75k-100k, 100k-150k, ...
    credit_score_range = db.Column(db.String(20))  # poor, fair, good, very_good, excellent
    savings_amount_range = db.Column(db.String(30))  # <1k, 1k-10k, 10k-50k, 50k-100k, 100k+
    investment_experience = db.Column(db.String(20))  # none, beginner, intermediate, advanced, expert
    risk_tolerance = db.Column(db.String(20))  # very_low, low, moderate, high, very_high
    
    # === HOUSING PREFERENCES ===
    desired_housing_type = db.Column(db.String(30))  # house, condo, townhouse, apartment, etc.
    preferred_bathrooms = db.Column(db.Integer)  # 1, 2, 3, 4, 5+
    preferred_bedrooms = db.Column(db.Integer)  # 1, 2, 3, 4, 5+
    preferred_lot_size = db.Column(db.String(20))  # small, medium, large, acreage
    preferred_home_age = db.Column(db.String(20))  # new, modern, established, historic
    preferred_architectural_style = db.Column(db.String(50))  # modern, contemporary, traditional, ranch, colonial, etc.
    preferred_home_features = db.Column(db.Text)  # JSON array of preferred features
    
    # === LOCATION PREFERENCES ===
    preferred_regions = db.Column(db.Text)  # JSON array of preferred regions/states
    preferred_climate = db.Column(db.String(30))  # tropical, temperate, cold, arid, humid
    urban_rural_preference = db.Column(db.String(20))  # urban, suburban, rural, mixed
    commute_tolerance = db.Column(db.Integer)  # max minutes willing to commute
    proximity_to_family = db.Column(db.String(20))  # very_important, important, neutral, not_important
    walkability_importance = db.Column(db.String(20))  # very_important, important, neutral, not_important
    
    # === LIFESTYLE PREFERENCES ===
    lifestyle_type = db.Column(db.String(30))  # active, quiet, social, family_oriented, career_focused
    hobbies_interests = db.Column(db.Text)  # JSON array of hobbies/interests
    dining_preferences = db.Column(db.Text)  # JSON array of cuisine types, dietary restrictions
    fitness_activities = db.Column(db.Text)  # JSON array of fitness activities

    # === BEHAVIORAL PATTERNS ===
    decision_making_style = db.Column(db.String(30))  # analytical, intuitive, collaborative, quick, deliberate
    research_behavior = db.Column(db.String(30))  # minimal, moderate, extensive, obsessive
    favored_information_style = db.Column(db.String(30))  # text, images, videos, audio, all

    # === ENVIRONMENTAL & SOCIAL VALUES ===
    political_leaning = db.Column(db.String(20))  # very_liberal, liberal, moderate, conservative, very_conservative
    community_involvement = db.Column(db.String(20))  # none, low, moderate, high, very_high
    
    # === REAL ESTATE SPECIFIC ===
    property_search_stage = db.Column(db.String(30))  # not_looking, browsing, actively_searching, ready_to_buy
    home_buying_experience = db.Column(db.String(20))  # first_time, experienced, investor, multiple_properties
    financing_preference = db.Column(db.String(30))  # conventional, fha, va, cash, investment_loan
    property_features_priority = db.Column(db.Text)  # JSON array of prioritized features
    deal_breakers = db.Column(db.Text)  # JSON array of absolute deal breakers
    renovation_willingness = db.Column(db.String(20))  # none, cosmetic, moderate, extensive, gut_renovation
    intended_property_use = db.Column(db.String(30))  # primary_residence, second_home, investment, vacation_home
    timeline_to_purchase = db.Column(db.String(20))  # <3_months, 3-6_months, 6-12_months, >1_year, not_sure
    current_home_ownership_status = db.Column(db.String(30))  # renting, own_home, living_with_family, other
    moving_reason = db.Column(db.String(30))  # job_change, upsize, downsize, retirement, investment, lifestyle, school_district
    
    # === AGENT INTERACTION PREFERENCES ===
    preferred_support_channel = db.Column(db.String(20))  # phone, email, chat, self_service
    communication_frequency = db.Column(db.String(20))  # minimal, weekly, daily, as_needed, constant
    information_detail_level = db.Column(db.String(20))  # summary, moderate, detailed, comprehensive
    meeting_preference = db.Column(db.String(20))  # virtual, in_person, hybrid, no_preference
    
    # === PERSONALIZATION INSIGHTS (AI) ===
    content_feedback_log = db.Column(db.Text)  # JSON of how they rated or reacted to prior reports
    agent_interaction_history = db.Column(db.Text)  # JSON list of touchpoints or agent name → type → feedback
    personality_insights = db.Column(db.Text)  # JSON with MBTI or Big 5 profile extracted from responses
    
    # === EMOTIONAL / NARRATIVE SIGNALS ===
    quote_bubbles = db.Column(db.Text)  # JSON array of user-submitted thoughts on what matters most
    deal_makers = db.Column(db.Text)  # JSON array of features that would seal a deal
    concerns_or_fears = db.Column(db.Text)  # JSON array like crime, flooding, bad neighbors, old plumbing
    
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
        """Convert preferences to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,

            'demographics': {
                'age': self.age,
                'gender': self.gender,
                'marital_status': self.marital_status,
                'household_size': self.household_size,
                'children_count': self.children_count,
                'children_ages': self._parse_json_field(self.children_ages),
                'education_level': self.education_level,
                'occupation': self.occupation,
                'industry': self.industry,
                'employment_status': self.employment_status,
            },

            'financial_profile': {
                'income_range': self.income_range,
                'preferred_home_price_range': self.preferred_home_price_range,
                'credit_score_range': self.credit_score_range,
                'savings_amount_range': self.savings_amount_range,
                'investment_experience': self.investment_experience,
                'risk_tolerance': self.risk_tolerance,
            },

            'housing_preferences': {
                'desired_housing_type': self.desired_housing_type,
                'preferred_bathrooms': self.preferred_bathrooms,
                'preferred_bedrooms': self.preferred_bedrooms,
                'preferred_lot_size': self.preferred_lot_size,
                'preferred_home_age': self.preferred_home_age,
                'preferred_architectural_style': self.preferred_architectural_style,
                'preferred_home_features': self._parse_json_field(self.preferred_home_features),
            },

            'location_preferences': {
                'preferred_regions': self._parse_json_field(self.preferred_regions),
                'preferred_climate': self.preferred_climate,
                'urban_rural_preference': self.urban_rural_preference,
                'commute_tolerance': self.commute_tolerance,
                'proximity_to_family': self.proximity_to_family,
                'walkability_importance': self.walkability_importance,
            },

            'lifestyle_preferences': {
                'lifestyle_type': self.lifestyle_type,
                'hobbies_interests': self._parse_json_field(self.hobbies_interests),
                'dining_preferences': self._parse_json_field(self.dining_preferences),
                'fitness_activities': self._parse_json_field(self.fitness_activities),
            },

            'behavioral_patterns': {
                'decision_making_style': self.decision_making_style,
                'research_behavior': self.research_behavior,
                'favored_information_style': self.favored_information_style,
            },

            'values': {
                'political_leaning': self.political_leaning,
                'community_involvement': self.community_involvement,
            },

            'real_estate': {
                'property_search_stage': self.property_search_stage,
                'home_buying_experience': self.home_buying_experience,
                'financing_preference': self.financing_preference,
                'property_features_priority': self._parse_json_field(self.property_features_priority),
                'deal_breakers': self._parse_json_field(self.deal_breakers),
                'renovation_willingness': self.renovation_willingness,
                'intended_property_use': self.intended_property_use,
                'timeline_to_purchase': self.timeline_to_purchase,
                'current_home_ownership_status': self.current_home_ownership_status,
                'moving_reason': self.moving_reason,
            },

            'agent_preferences': {
                'preferred_support_channel': self.preferred_support_channel,
                'communication_frequency': self.communication_frequency,
                'information_detail_level': self.information_detail_level,
                'meeting_preference': self.meeting_preference,
            },

            'personalization_insights': {
                'content_feedback_log': self._parse_json_field(self.content_feedback_log),
                'agent_interaction_history': self._parse_json_field(self.agent_interaction_history),
                'personality_insights': self._parse_json_field(self.personality_insights),
            },

            'emotional_signals': {
                'quote_bubbles': self._parse_json_field(self.quote_bubbles),
                'deal_makers': self._parse_json_field(self.deal_makers),
                'concerns_or_fears': self._parse_json_field(self.concerns_or_fears),
            },

            'metadata': {
                'solo_reports_created': self.solo_reports_created,
                'group_reports_created': self.group_reports_created,
                'solo_reports_addresses': self._parse_json_field(self.solo_reports_addresses),
                'group_reports_addresses': self._parse_json_field(self.group_reports_addresses),
                'chat_sessions': self._parse_json_field(self.chat_sessions),
                'preferences_version': self.preferences_version,
                'last_updated_section': self.last_updated_section,
                'data_sources': self._parse_json_field(self.data_sources),
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            }
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

    def get_profile_completeness(self):
        """Calculate how complete the user profile is (0-100%)"""
        total_fields = 0
        filled_fields = 0
        for column in self.__table__.columns:
            if column.name not in [
                'id', 'user_id', 'created_at', 'updated_at', 
                'last_updated_section', 'preferences_version', 
                'data_sources', 'confidence_score'
            ]:
                total_fields += 1
                if getattr(self, column.name) is not None:
                    filled_fields += 1
        return round((filled_fields / total_fields) * 100, 1) if total_fields > 0 else 0.0

    def get_agent_summary(self):
        """Generate a concise summary for AI agents"""
        return {
            'profile_completeness': f"{self.get_profile_completeness()}%",
            'key_demographics': {
                'age': self.age,
                'income_range': self.income_range,
                'household_size': self.household_size,
                'employment_status': self.employment_status,
                'marital_status': self.marital_status,
            },
            'real_estate_readiness': {
                'search_stage': self.property_search_stage,
                'experience_level': self.home_buying_experience,
                'financing_preference': self.financing_preference,
                'timeline_to_purchase': self.timeline_to_purchase,
                'intended_use': self.intended_property_use,
                'current_status': self.current_home_ownership_status,
                'moving_reason': self.moving_reason,
            },
            'communication_preferences': {
                'preferred_channel': self.preferred_support_channel,
                'frequency': self.communication_frequency,
                'detail_level': self.information_detail_level,
                'meeting_preference': self.meeting_preference,
            },
            'decision_factors': {
                'decision_style': self.decision_making_style,
                'research_behavior': self.research_behavior,
                'renovation_willingness': self.renovation_willingness,
            },
            'personalization_data': {
                'personality_insights': self._parse_json_field(self.personality_insights),
                'content_feedback': self._parse_json_field(self.content_feedback_log),
                'interaction_history': self._parse_json_field(self.agent_interaction_history),
            },
            'emotional_signals': {
                'key_motivators': self._parse_json_field(self.deal_makers),
                'concerns': self._parse_json_field(self.concerns_or_fears),
                'personal_quotes': self._parse_json_field(self.quote_bubbles),
            }
        }

    def __repr__(self):
        return f'<UserPreferences {self.user_id} - {self.get_profile_completeness()}% complete>'
