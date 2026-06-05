"""Client–agent connection persistence."""

from __future__ import annotations

from sqlalchemy import select

from app import db
from app.models import AgentConnections, User
from app.utils.db import db_transaction


def find_user_by_cognito_id(cognito_id: str) -> User | None:
    return db.session.scalar(select(User).where(User.cognito_id == cognito_id))


def find_agent_connection(agent_id: str, client_id: str) -> AgentConnections | None:
    return db.session.scalar(
        select(AgentConnections).where(
            AgentConnections.agent_id == agent_id,
            AgentConnections.client_id == client_id,
        )
    )


def create_agent_connection(agent_id: str, client_id: str) -> AgentConnections:
    connection = AgentConnections(agent_id=agent_id, client_id=client_id)
    with db_transaction():
        db.session.add(connection)
    return connection


def delete_agent_connection(connection: AgentConnections) -> None:
    with db_transaction():
        db.session.delete(connection)
