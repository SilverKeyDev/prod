"""
Milestone Routes
Handles milestone creation, updates, and Google Calendar integration
"""

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, make_response
from googleapiclient.errors import HttpError

from ..models.milestone import Milestone
from ..services.google_calendar_service import google_calendar_service
from ..services.security import (
    sanitize_error_message,
    log_oauth_event,
    validate_event_data
)
from ..utils.app_logging import get_logger
from ..utils.security import security_error_response, SecurityError, rate_limit
from ..utils.secure_errors import SecureErrorHandler
from app import db

logger = get_logger()

# Create blueprint
milestones_bp = Blueprint("milestones", __name__, url_prefix="/api/v1/milestones")


@milestones_bp.route("", methods=["GET"])
@rate_limit(max_requests=100, window_seconds=60)
def list_milestones():
    """List user's milestones"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        milestone_type = request.args.get("type")  # Optional filter by type
        status = request.args.get("status")  # Optional filter by status
        
        query = Milestone.query.filter_by(user_id=user_id)
        
        if milestone_type:
            query = query.filter_by(type=milestone_type)
        if status:
            query = query.filter_by(status=status)
        
        milestones = query.order_by(Milestone.scheduled_date.asc()).all()
        return jsonify({"items": [m.to_dict() for m in milestones]}), 200
        
    except Exception as e:
        logger.error(f"Error listing milestones: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to list milestones")


@milestones_bp.route("", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
def create_milestone():
    """Create a new milestone and optionally add to Google Calendar"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["type", "title", "scheduled_date"]
        for field in required_fields:
            if field not in data:
                return make_response((f"Missing required field: {field}", 400))
        
        # Parse scheduled date
        try:
            scheduled_date = datetime.fromisoformat(data["scheduled_date"].replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return make_response(("Invalid scheduled_date format. Use ISO 8601 format.", 400))
        
        # Create milestone
        milestone = Milestone(
            user_id=user_id,
            type=data["type"],
            title=data["title"],
            description=data.get("description"),
            property_address=data.get("property_address"),
            scheduled_date=scheduled_date,
            duration_minutes=data.get("duration_minutes", 30),
            status="scheduled"
        )
        
        db.session.add(milestone)
        db.session.flush()  # Get the ID
        
        # If add_to_calendar is True and Google Calendar is connected, create event
        add_to_calendar = data.get("add_to_calendar", False)
        if add_to_calendar:
            try:
                # Calculate end time
                end_date = scheduled_date + timedelta(minutes=milestone.duration_minutes)
                
                # Build event data
                event_data = {
                    "summary": milestone.title,
                    "description": milestone.description or f"{milestone.type.title()} for {milestone.property_address or 'property'}",
                    "start": {
                        "dateTime": scheduled_date.isoformat(),
                        "timeZone": "America/Los_Angeles"  # Default, can be made configurable
                    },
                    "end": {
                        "dateTime": end_date.isoformat(),
                        "timeZone": "America/Los_Angeles"
                    },
                    "location": milestone.property_address or "",
                    "reminders": {
                        "useDefault": True
                    }
                }
                
                calendar_id = data.get("calendar_id", "primary")
                google_event = google_calendar_service.create_event(user_id, event_data, calendar_id)
                
                # Update milestone with Google Calendar info
                milestone.google_event_id = google_event.get("id")
                milestone.google_calendar_id = calendar_id
                milestone.google_event_link = google_event.get("htmlLink")
                
                logger.info(f"Created Google Calendar event for milestone {milestone.id}")
                
            except RuntimeError as e:
                # Google Calendar not connected, but milestone is still created
                logger.warning(f"Could not add milestone to Google Calendar: {str(e)}")
            except Exception as e:
                logger.error(f"Error creating Google Calendar event: {str(e)}")
                # Continue - milestone is created even if calendar event fails
        
        db.session.commit()
        
        return jsonify(milestone.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating milestone: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to create milestone")


@milestones_bp.route("/<milestone_id>", methods=["PATCH"])
@rate_limit(max_requests=50, window_seconds=60)
def update_milestone(milestone_id):
    """Update a milestone and optionally update Google Calendar event"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        milestone = Milestone.query.filter_by(id=milestone_id, user_id=user_id).first()
        if not milestone:
            return make_response(("Milestone not found", 404))
        
        data = request.get_json()
        
        # Update fields
        if "title" in data:
            milestone.title = data["title"]
        if "description" in data:
            milestone.description = data["description"]
        if "property_address" in data:
            milestone.property_address = data["property_address"]
        if "scheduled_date" in data:
            try:
                milestone.scheduled_date = datetime.fromisoformat(data["scheduled_date"].replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                return make_response(("Invalid scheduled_date format. Use ISO 8601 format.", 400))
        if "duration_minutes" in data:
            milestone.duration_minutes = data["duration_minutes"]
        if "status" in data:
            milestone.status = data["status"]
        
        milestone.updated_at = datetime.utcnow()
        
        # If milestone has Google Calendar event and update_calendar is True, update event
        update_calendar = data.get("update_calendar", False)
        if update_calendar and milestone.google_event_id:
            try:
                # Calculate end time
                end_date = milestone.scheduled_date + timedelta(minutes=milestone.duration_minutes)
                
                # Get existing event first to preserve other fields
                creds = google_calendar_service.load_credentials(user_id)
                from googleapiclient.discovery import build
                service = build("calendar", "v3", credentials=creds, cache_discovery=False)
                existing_event = service.events().get(
                    calendarId=milestone.google_calendar_id,
                    eventId=milestone.google_event_id
                ).execute()
                
                # Update event data
                existing_event["summary"] = milestone.title
                existing_event["description"] = milestone.description or f"{milestone.type.title()} for {milestone.property_address or 'property'}"
                existing_event["start"]["dateTime"] = milestone.scheduled_date.isoformat()
                existing_event["end"]["dateTime"] = end_date.isoformat()
                if milestone.property_address:
                    existing_event["location"] = milestone.property_address
                
                google_event = google_calendar_service.update_event(
                    user_id,
                    milestone.google_event_id,
                    existing_event,
                    milestone.google_calendar_id
                )
                
                milestone.google_event_link = google_event.get("htmlLink")
                
                logger.info(f"Updated Google Calendar event for milestone {milestone.id}")
                
            except RuntimeError as e:
                logger.warning(f"Could not update Google Calendar event: {str(e)}")
            except Exception as e:
                logger.error(f"Error updating Google Calendar event: {str(e)}")
        
        db.session.commit()
        
        return jsonify(milestone.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating milestone: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to update milestone")


@milestones_bp.route("/<milestone_id>", methods=["DELETE"])
@rate_limit(max_requests=50, window_seconds=60)
def delete_milestone(milestone_id):
    """Delete a milestone and optionally cancel Google Calendar event"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        milestone = Milestone.query.filter_by(id=milestone_id, user_id=user_id).first()
        if not milestone:
            return make_response(("Milestone not found", 404))
        
        # If milestone has Google Calendar event and cancel_calendar is True, delete event
        cancel_calendar = request.args.get("cancel_calendar", "false").lower() == "true"
        if cancel_calendar and milestone.google_event_id:
            try:
                google_calendar_service.delete_event(
                    user_id,
                    milestone.google_event_id,
                    milestone.google_calendar_id
                )
                logger.info(f"Deleted Google Calendar event for milestone {milestone.id}")
            except RuntimeError as e:
                logger.warning(f"Could not delete Google Calendar event: {str(e)}")
            except Exception as e:
                logger.error(f"Error deleting Google Calendar event: {str(e)}")
        
        db.session.delete(milestone)
        db.session.commit()
        
        return jsonify({"ok": True}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting milestone: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to delete milestone")


@milestones_bp.route("/<milestone_id>/add-to-calendar", methods=["POST"])
@rate_limit(max_requests=50, window_seconds=60)
def add_milestone_to_calendar(milestone_id):
    """Add an existing milestone to Google Calendar"""
    try:
        from ..utils.auth import get_current_user
        user = get_current_user()
        if not user:
            return security_error_response(SecurityError.UNAUTHORIZED)
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return security_error_response(SecurityError.UNAUTHORIZED)
    
    try:
        milestone = Milestone.query.filter_by(id=milestone_id, user_id=user_id).first()
        if not milestone:
            return make_response(("Milestone not found", 404))
        
        if milestone.google_event_id:
            return make_response(("Milestone already has a Google Calendar event", 400))
        
        data = request.get_json() or {}
        calendar_id = data.get("calendar_id", "primary")
        
        # Calculate end time
        end_date = milestone.scheduled_date + timedelta(minutes=milestone.duration_minutes)
        
        # Build event data
        event_data = {
            "summary": milestone.title,
            "description": milestone.description or f"{milestone.type.title()} for {milestone.property_address or 'property'}",
            "start": {
                "dateTime": milestone.scheduled_date.isoformat(),
                "timeZone": "America/Los_Angeles"
            },
            "end": {
                "dateTime": end_date.isoformat(),
                "timeZone": "America/Los_Angeles"
            },
            "location": milestone.property_address or "",
            "reminders": {
                "useDefault": True
            }
        }
        
        google_event = google_calendar_service.create_event(user_id, event_data, calendar_id)
        
        # Update milestone with Google Calendar info
        milestone.google_event_id = google_event.get("id")
        milestone.google_calendar_id = calendar_id
        milestone.google_event_link = google_event.get("htmlLink")
        
        db.session.commit()
        
        return jsonify(milestone.to_dict()), 200
        
    except RuntimeError as e:
        return make_response((str(e), 401))
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding milestone to calendar: {str(e)}", exc_info=True)
        return SecureErrorHandler.handle_error(e, "Failed to add milestone to calendar")

