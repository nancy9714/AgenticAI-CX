import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from api.models import EmailRequest, EmailAnalysis, Intent, Urgency, EmotionalTone


# ─── Sample emails for testing ───────────────────────────────────────────────

ANGRY_REFUND_EMAIL = EmailRequest(
    from_email="john.doe@gmail.com",
    customer_name="John Doe",
    subject="I want my money back NOW - Order completely wrong",
    body="""This is absolutely unacceptable. I ordered a premium subscription 3 weeks ago 
    and still haven't received access. I've sent 4 emails already with zero response. 
    I'm extremely frustrated. I want a full refund immediately or I'm going to dispute 
    this with my credit card company. Order ID: ORD-12345.""",
    order_id="ORD-12345"
)

LEGAL_THREAT_EMAIL = EmailRequest(
    from_email="angry.customer@corp.com",
    customer_name="Robert Smith",
    subject="Legal action notice",
    body="""Dear Zykrr, I am writing to inform you that due to your continued failure 
    to resolve my billing issue, I have retained legal counsel and will be pursuing 
    litigation if this is not resolved within 48 hours. This is your final notice."""
)

SIMPLE_QUERY_EMAIL = EmailRequest(
    from_email="curious@example.com",
    customer_name="Alice",
    subject="How do I export my data?",
    body="Hi, I just signed up and love the product! Quick question - how do I export my survey data to Excel? Thanks!"
)

MISSING_INFO_EMAIL = EmailRequest(
    from_email="confused@test.com",
    subject="My thing isn't working",
    body="Hi, my account isn't working and I can't login. Please help."
)


# ─── Unit Tests ───────────────────────────────────────────────────────────────

class TestEmailAnalysis:
    """Test that analysis returns correct structure"""

    def test_analysis_model_valid(self):
        analysis = EmailAnalysis(
            intent=Intent.REFUND_REQUEST,
            urgency=Urgency.HIGH,
            emotional_tone=EmotionalTone.ANGRY,
            summary="Customer wants refund for undelivered order",
            key_issues=["no access", "ignored emails"],
            requires_escalation=False,
            sentiment_score=-0.9
        )
        assert analysis.intent == Intent.REFUND_REQUEST
        assert analysis.urgency == Urgency.HIGH
        assert analysis.sentiment_score == -0.9

    def test_sentiment_score_range(self):
        """Sentiment must be -1.0 to 1.0"""
        analysis = EmailAnalysis(
            intent=Intent.APPRECIATION,
            urgency=Urgency.LOW,
            emotional_tone=EmotionalTone.SATISFIED,
            summary="Happy customer",
            key_issues=[],
            requires_escalation=False,
            sentiment_score=0.95
        )
        assert -1.0 <= analysis.sentiment_score <= 1.0

    def test_escalation_with_reason(self):
        analysis = EmailAnalysis(
            intent=Intent.ESCALATION,
            urgency=Urgency.HIGH,
            emotional_tone=EmotionalTone.ANGRY,
            summary="Legal threat",
            key_issues=["legal action"],
            requires_escalation=True,
            escalation_reason="Customer mentioned legal counsel",
            sentiment_score=-1.0
        )
        assert analysis.requires_escalation is True
        assert analysis.escalation_reason is not None


class TestToolExecution:
    """Test mock tool executions"""

    def test_process_refund(self):
        from tools.actions import execute_tool
        result = execute_tool("process_refund", {
            "order_id": "ORD-123",
            "reason": "Product not delivered",
            "refund_type": "full"
        })
        assert result["success"] is True
        assert "refund_id" in result
        assert result["refund_id"].startswith("REF-")

    def test_send_apology(self):
        from tools.actions import execute_tool
        result = execute_tool("send_apology", {
            "customer_name": "John",
            "issue_summary": "Delivery failure"
        })
        assert result["success"] is True
        assert "apology_id" in result

    def test_schedule_callback(self):
        from tools.actions import execute_tool
        result = execute_tool("schedule_callback", {
            "customer_email": "test@test.com",
            "reason": "Complex issue",
            "priority": "high"
        })
        assert result["success"] is True
        assert "callback_id" in result
        assert "scheduled_for" in result

    def test_escalate_to_human(self):
        from tools.actions import execute_tool
        result = execute_tool("escalate_to_human", {
            "reason": "Legal threat",
            "urgency": "immediate",
            "department": "legal",
            "context_summary": "Customer mentioned litigation"
        })
        assert result["success"] is True
        assert result["ticket_id"].startswith("ESC-")

    def test_goodwill_credit(self):
        """Custom rule: goodwill credit tool"""
        from tools.actions import execute_tool
        result = execute_tool("apply_goodwill_credit", {
            "customer_email": "vip@test.com",
            "credit_amount": 25,
            "reason": "Proactive trust recovery - high frustration"
        })
        assert result["success"] is True
        assert result["credit_amount"] == 25
        assert result["credit_id"].startswith("GWC-")

    def test_unknown_tool_returns_failure(self):
        from tools.actions import execute_tool
        result = execute_tool("nonexistent_tool", {})
        assert result["success"] is False


class TestCustomRule:
    """Test the custom goodwill credit rule logic"""

    def test_goodwill_triggers_on_very_negative_sentiment(self):
        """Custom rule: sentiment < -0.6 + complaint intent = goodwill credit"""
        analysis = EmailAnalysis(
            intent=Intent.COMPLAINT,
            urgency=Urgency.HIGH,
            emotional_tone=EmotionalTone.ANGRY,
            summary="Very upset customer",
            key_issues=["service failure"],
            requires_escalation=False,
            sentiment_score=-0.75
        )
        # Rule condition
        should_apply_goodwill = (
            analysis.sentiment_score < -0.6 and
            analysis.intent == Intent.COMPLAINT
        )
        assert should_apply_goodwill is True

    def test_goodwill_does_not_trigger_on_mild_complaint(self):
        analysis = EmailAnalysis(
            intent=Intent.COMPLAINT,
            urgency=Urgency.LOW,
            emotional_tone=EmotionalTone.NEUTRAL,
            summary="Minor complaint",
            key_issues=["small issue"],
            requires_escalation=False,
            sentiment_score=-0.3
        )
        should_apply_goodwill = (
            analysis.sentiment_score < -0.6 and
            analysis.intent == Intent.COMPLAINT
        )
        assert should_apply_goodwill is False


class TestEmailRequestModel:
    """Test request model validation"""

    def test_email_request_required_fields(self):
        req = EmailRequest(
            from_email="test@test.com",
            subject="Test",
            body="Test body"
        )
        assert req.from_email == "test@test.com"
        assert req.email_id is None  # Optional field

    def test_email_request_with_all_fields(self):
        req = EmailRequest(
            email_id="EMAIL-001",
            from_email="test@test.com",
            subject="Test Subject",
            body="Test body content",
            customer_name="Test User",
            order_id="ORD-999"
        )
        assert req.order_id == "ORD-999"
        assert req.customer_name == "Test User"


# ─── Integration Test (requires API key) ─────────────────────────────────────

@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_pipeline_angry_refund():
    """Integration test: angry refund email should trigger refund + apology"""
    import os
    if not os.getenv("ANTHROPIC_API_KEY"):
        pytest.skip("ANTHROPIC_API_KEY not set")

    from agents.cx_agent import CXAgent
    agent = CXAgent()
    result = await agent.process(ANGRY_REFUND_EMAIL)

    assert result.analysis.intent == Intent.REFUND_REQUEST
    assert result.analysis.urgency in [Urgency.HIGH, Urgency.MEDIUM]
    assert any(a.action_type == "process_refund" for a in result.actions_taken)
    assert len(result.response_email) > 50


@pytest.mark.integration
@pytest.mark.asyncio
async def test_full_pipeline_legal_threat():
    """Integration test: legal threat should be escalated to legal team"""
    import os
    if not os.getenv("ANTHROPIC_API_KEY"):
        pytest.skip("ANTHROPIC_API_KEY not set")

    from agents.cx_agent import CXAgent
    agent = CXAgent()
    result = await agent.process(LEGAL_THREAT_EMAIL)

    assert result.escalated is True
    assert any(a.action_type == "escalate_to_human" for a in result.actions_taken)
