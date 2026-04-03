import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Any

# ─────────────────────────────────────────────
#  TOOL DEFINITIONS (passed to Claude as tools)
# ─────────────────────────────────────────────

TOOLS = [
    {
        "name": "process_refund",
        "description": "Initiate a refund for a customer order. Use when customer has a valid refund request for a defective, undelivered, or unsatisfactory product/service.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "Order ID to refund"},
                "amount": {"type": "number", "description": "Refund amount in USD. Use -1 if full refund."},
                "reason": {"type": "string", "description": "Reason for refund"},
                "refund_type": {"type": "string", "enum": ["full", "partial"], "description": "Type of refund"}
            },
            "required": ["order_id", "reason", "refund_type"]
        }
    },
    {
        "name": "send_apology",
        "description": "Send a formal apology to a customer. Use when customer has experienced a negative interaction, service failure, or emotional distress.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_name": {"type": "string", "description": "Customer's name"},
                "issue_summary": {"type": "string", "description": "Brief summary of the issue being apologized for"},
                "compensation_offered": {"type": "string", "description": "Any compensation being offered (discount, credit, etc.)"}
            },
            "required": ["customer_name", "issue_summary"]
        }
    },
    {
        "name": "schedule_callback",
        "description": "Schedule a callback from a support agent. Use when customer has requested a call, or when the issue is complex enough to require voice communication.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_email": {"type": "string", "description": "Customer email"},
                "preferred_time": {"type": "string", "description": "Preferred callback time if mentioned, else 'next_available'"},
                "reason": {"type": "string", "description": "Reason for callback"},
                "priority": {"type": "string", "enum": ["high", "medium", "low"]}
            },
            "required": ["customer_email", "reason", "priority"]
        }
    },
    {
        "name": "escalate_to_human",
        "description": "Escalate the ticket to a human agent immediately. Use for: legal threats, abuse, safety concerns, fraud, complex billing disputes, VIP customers, or situations requiring human judgment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {"type": "string", "description": "Why this needs human intervention"},
                "urgency": {"type": "string", "enum": ["immediate", "within_hour", "within_day"]},
                "department": {"type": "string", "enum": ["legal", "billing", "technical", "senior_support", "vip_desk"]},
                "context_summary": {"type": "string", "description": "Brief context for the human agent"}
            },
            "required": ["reason", "urgency", "department", "context_summary"]
        }
    },
    {
        "name": "ask_followup",
        "description": "Generate intelligent follow-up questions when critical information is missing to resolve the issue.",
        "input_schema": {
            "type": "object",
            "properties": {
                "missing_info": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of information items needed to resolve the issue"
                }
            },
            "required": ["missing_info"]
        }
    },
    {
        "name": "apply_goodwill_credit",
        "description": "CUSTOM RULE: Apply a goodwill credit to customer account when they've had 2+ issues in 30 days or express extreme frustration. This is Zykrr's proactive trust-recovery mechanism.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_email": {"type": "string", "description": "Customer email"},
                "credit_amount": {"type": "number", "description": "Credit amount in USD (10-100)"},
                "reason": {"type": "string", "description": "Reason for goodwill credit"}
            },
            "required": ["customer_email", "credit_amount", "reason"]
        }
    }
]


# ─────────────────────────────────────────────
#  TOOL EXECUTOR
# ─────────────────────────────────────────────

def execute_tool(tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
    """Execute mock tool actions and return results."""

    if tool_name == "process_refund":
        return {
            "success": True,
            "refund_id": f"REF-{uuid.uuid4().hex[:8].upper()}",
            "order_id": tool_input.get("order_id", "UNKNOWN"),
            "amount": tool_input.get("amount", "full"),
            "estimated_days": 3,
            "message": f"Refund initiated successfully. Will reflect in 3-5 business days.",
            "action_type": "process_refund"
        }

    elif tool_name == "send_apology":
        return {
            "success": True,
            "apology_id": f"APO-{uuid.uuid4().hex[:6].upper()}",
            "customer_name": tool_input.get("customer_name"),
            "compensation": tool_input.get("compensation_offered", "none"),
            "message": "Formal apology logged and queued for delivery.",
            "action_type": "send_apology"
        }

    elif tool_name == "schedule_callback":
        callback_time = datetime.now() + timedelta(hours=2)
        return {
            "success": True,
            "callback_id": f"CB-{uuid.uuid4().hex[:6].upper()}",
            "scheduled_for": callback_time.strftime("%Y-%m-%d %H:%M"),
            "customer_email": tool_input.get("customer_email"),
            "priority": tool_input.get("priority"),
            "message": f"Callback scheduled for {callback_time.strftime('%b %d, %I:%M %p')}.",
            "action_type": "schedule_callback"
        }

    elif tool_name == "escalate_to_human":
        return {
            "success": True,
            "ticket_id": f"ESC-{uuid.uuid4().hex[:8].upper()}",
            "department": tool_input.get("department"),
            "urgency": tool_input.get("urgency"),
            "assigned_to": "Senior Support Team",
            "message": f"Escalated to {tool_input.get('department')} team with {tool_input.get('urgency')} priority.",
            "action_type": "escalate_to_human"
        }

    elif tool_name == "ask_followup":
        return {
            "success": True,
            "questions_generated": len(tool_input.get("missing_info", [])),
            "missing_info": tool_input.get("missing_info", []),
            "action_type": "ask_followup"
        }

    elif tool_name == "apply_goodwill_credit":
        return {
            "success": True,
            "credit_id": f"GWC-{uuid.uuid4().hex[:6].upper()}",
            "customer_email": tool_input.get("customer_email"),
            "credit_amount": tool_input.get("credit_amount"),
            "valid_days": 90,
            "message": f"${tool_input.get('credit_amount')} goodwill credit applied. Valid for 90 days.",
            "action_type": "apply_goodwill_credit"
        }

    return {"success": False, "message": f"Unknown tool: {tool_name}"}
