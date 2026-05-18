"""Tests for get_agent_clients enrichment (client_kind, pipeline_stage)."""

import json
from datetime import datetime, timezone

from app.models import AgentConnections, TransactionTask, User, UserRole
from app.services.agent.client_service import get_agent_clients


def test_get_agent_clients_client_kind_from_roles(db_session):
    agent = User(
        id="agent-e1",
        cognito_id="cog-a1",
        email="a1@example.com",
        name="Agent",
        is_agent=True,
        client_ids='["c-buyer","c-seller","c-mix"]',
    )
    c_buyer = User(
        id="c-buyer",
        cognito_id="cog-b1",
        email="b1@example.com",
        name="Buyer",
        is_agent=False,
    )
    c_seller = User(
        id="c-seller",
        cognito_id="cog-s1",
        email="s1@example.com",
        name="Seller",
        is_agent=False,
    )
    c_mix = User(
        id="c-mix",
        cognito_id="cog-m1",
        email="m1@example.com",
        name="Mix",
        is_agent=False,
    )
    c_none = User(
        id="c-none",
        cognito_id="cog-n1",
        email="n1@example.com",
        name="No roles",
        is_agent=False,
    )
    db_session.session.add_all([agent, c_buyer, c_seller, c_mix, c_none])
    db_session.session.add(UserRole(user_id="c-buyer", role="buyer"))
    db_session.session.add(UserRole(user_id="c-seller", role="seller"))
    db_session.session.add(UserRole(user_id="c-mix", role="buyer"))
    db_session.session.add(UserRole(user_id="c-mix", role="seller"))
    conn = AgentConnections(agent_id="agent-e1", client_id="c-none")
    db_session.session.add(conn)
    db_session.session.commit()

    out = get_agent_clients("agent-e1")
    by_id = {row["id"]: row for row in out}

    assert by_id["c-buyer"]["client_kind"] == "buyer"
    assert by_id["c-seller"]["client_kind"] == "seller"
    assert by_id["c-mix"]["client_kind"] == "seller"
    assert by_id["c-none"]["client_kind"] == "unknown"
    for row in out:
        assert row["pipeline_stage"] == "search"


def test_get_agent_clients_pipeline_stage_most_recent_category(db_session):
    agent = User(
        id="agent-e2",
        cognito_id="cog-a2",
        email="a2@example.com",
        name="Agent 2",
        is_agent=True,
        client_ids='["c1","c2"]',
    )
    c1 = User(
        id="c1",
        cognito_id="cog-c1",
        email="c1@example.com",
        name="One",
        is_agent=False,
    )
    c2 = User(
        id="c2",
        cognito_id="cog-c2",
        email="c2@example.com",
        name="Two",
        is_agent=False,
    )
    db_session.session.add_all([agent, c1, c2])

    older = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    newer = datetime(2024, 6, 1, 12, 0, 0, tzinfo=timezone.utc)

    db_session.session.add(
        TransactionTask(
            user_id="c1",
            category="search",
            title="Done",
            status="done",
            order_index=0,
            task_metadata={"templateId": 1},
            updated_at=older,
        )
    )
    db_session.session.add(
        TransactionTask(
            user_id="c1",
            category="offer",
            title="Done",
            status="done",
            order_index=0,
            task_metadata={"templateId": 2},
            updated_at=newer,
        )
    )
    db_session.session.commit()

    out = get_agent_clients("agent-e2")
    by_id = {row["id"]: row for row in out}

    assert by_id["c1"]["pipeline_stage"] == "offer"
    assert by_id["c2"]["pipeline_stage"] == "search"


def test_get_agent_clients_client_kind_investor(db_session):
    agent = User(
        id="agent-inv",
        cognito_id="cog-inv-a",
        email="inv-a@example.com",
        name="Agent Inv",
        is_agent=True,
        client_ids='["c-inv"]',
    )
    client_u = User(
        id="c-inv",
        cognito_id="cog-inv-c",
        email="inv-c@example.com",
        name="Investor Client",
        is_agent=False,
    )
    db_session.session.add_all([agent, client_u])
    db_session.session.add(UserRole(user_id="c-inv", role="investor"))
    db_session.session.commit()

    out = get_agent_clients("agent-inv")
    assert len(out) == 1
    assert out[0]["client_kind"] == "investor"


def test_get_agent_clients_pipeline_stage_tie_breaks_on_rank_when_same_timestamp(db_session):
    agent = User(
        id="agent-e3",
        cognito_id="cog-a3",
        email="a3@example.com",
        name="Agent 3",
        is_agent=True,
        client_ids='["c-tie"]',
    )
    cu = User(
        id="c-tie",
        cognito_id="cog-tie",
        email="tie@example.com",
        name="Tie",
        is_agent=False,
    )
    db_session.session.add_all([agent, cu])
    same = datetime(2024, 6, 15, 12, 0, 0, tzinfo=timezone.utc)
    db_session.session.add(
        TransactionTask(
            user_id="c-tie",
            category="search",
            title="Done search",
            status="done",
            order_index=0,
            task_metadata={"templateId": 1},
            updated_at=same,
        )
    )
    db_session.session.add(
        TransactionTask(
            user_id="c-tie",
            category="offer",
            title="Done offer",
            status="done",
            order_index=0,
            task_metadata={"templateId": 2},
            updated_at=same,
        )
    )
    db_session.session.commit()

    out = get_agent_clients("agent-e3")
    assert out[0]["pipeline_stage"] == "offer"


def test_get_agent_clients_syncs_connection_clients_into_client_ids(db_session):
    agent = User(
        id="agent-sync",
        cognito_id="cog-sync-a",
        email="sync-a@example.com",
        name="Agent Sync",
        is_agent=True,
        client_ids='["c-on-list"]',
    )
    on_list = User(
        id="c-on-list",
        cognito_id="cog-on",
        email="on@example.com",
        name="On list",
        is_agent=False,
    )
    from_conn = User(
        id="c-from-conn",
        cognito_id="cog-conn",
        email="conn@example.com",
        name="From connection",
        is_agent=False,
    )
    db_session.session.add_all([agent, on_list, from_conn])
    db_session.session.add(AgentConnections(agent_id="agent-sync", client_id="c-from-conn"))
    db_session.session.commit()

    out = get_agent_clients("agent-sync")
    ids = {row["id"] for row in out}
    assert ids == {"c-on-list", "c-from-conn"}

    db_session.session.refresh(agent)
    synced = set(json.loads(agent.client_ids))
    assert synced == {"c-on-list", "c-from-conn"}


def test_get_agent_clients_parses_csv_client_ids(db_session):
    agent = User(
        id="agent-csv",
        cognito_id="cog-csv-a",
        email="csv-a@example.com",
        name="Agent CSV",
        is_agent=True,
        client_ids="c-a, c-b",
    )
    ca = User(
        id="c-a",
        cognito_id="cog-csv-1",
        email="a@csv.example.com",
        name="A",
        is_agent=False,
    )
    cb = User(
        id="c-b",
        cognito_id="cog-csv-2",
        email="b@csv.example.com",
        name="B",
        is_agent=False,
    )
    db_session.session.add_all([agent, ca, cb])
    db_session.session.commit()

    out = get_agent_clients("agent-csv")
    assert {row["id"] for row in out} == {"c-a", "c-b"}


def test_get_agent_clients_current_step_label_for_new_client(db_session):
    agent = User(
        id="agent-step",
        cognito_id="cog-step-a",
        email="step-a@example.com",
        name="Agent Step",
        is_agent=True,
        client_ids='["c-new"]',
    )
    client_u = User(
        id="c-new",
        cognito_id="cog-step-c",
        email="new@example.com",
        name="New Client",
        is_agent=False,
    )
    db_session.session.add_all([agent, client_u])
    db_session.session.commit()

    out = get_agent_clients("agent-step")
    assert len(out) == 1
    row = out[0]
    assert row["current_phase"] == "search"
    assert row["current_step_label"] == "Set a budget"
    assert row["requires_signature"] is False


def test_get_agent_clients_requires_signature_when_client_signed_agent_not(db_session):
    from app.models import Agreement, AgreementParticipant

    agent = User(
        id="agent-sign",
        cognito_id="cog-sign-a",
        email="sign-a@example.com",
        name="Agent Sign",
        is_agent=True,
        client_ids='["c-sign"]',
    )
    client_u = User(
        id="c-sign",
        cognito_id="cog-sign-c",
        email="sign-c@example.com",
        name="Sign Client",
        is_agent=False,
    )
    db_session.session.add_all([agent, client_u])
    agreement = Agreement(
        id="agr-1",
        status="sent",
        title="Buyer broker agreement",
        agent_id="agent-sign",
        buyer_id="c-sign",
        agreement_type="buyer_broker",
    )
    db_session.session.add(agreement)
    db_session.session.add(
        AgreementParticipant(
            agreement_id="agr-1",
            user_id="c-sign",
            email="sign-c@example.com",
            name="Sign Client",
            role="signer",
            recipient_status="signed",
        )
    )
    db_session.session.add(
        AgreementParticipant(
            agreement_id="agr-1",
            user_id="agent-sign",
            email="sign-a@example.com",
            name="Agent Sign",
            role="signer",
            recipient_status="sent",
        )
    )
    db_session.session.commit()

    out = get_agent_clients("agent-sign")
    assert out[0]["requires_signature"] is True
