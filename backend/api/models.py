from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum

class EmailRequest(BaseModel):
    email_id: Optional[str] = None
    from_email: str
    subject: str
    body: str
    customer_name: Optional[str] = None
    order_id: Optional[str] = None

class Intent(str, Enum):
    REFUND_REQUEST = "refund_request"
    COMPLAINT = "complaint"
    QUERY = "query"
    CANCELLATION = "cancellation"
    APPRECIATION = "appreciation"
    CALLBACK_REQUEST = "callback_request"
    ESCALATION = "escalation"
    OTHER = "other"

class Urgency(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class EmotionalTone(str, Enum):
    ANGRY = "angry"
    FRUSTRATED = "frustrated"
    SAD = "sad"
    NEUTRAL = "neutral"
    SATISFIED = "satisfied"
    ANXIOUS = "anxious"

class EmailAnalysis(BaseModel):
    intent: Intent
    urgency: Urgency
    emotional_tone: EmotionalTone
    summary: str
    key_issues: List[str]
    requires_escalation: bool
    escalation_reason: Optional[str] = None
    missing_info: List[str] = []
    sentiment_score: float  # -1.0 to 1.0

class ActionTaken(BaseModel):
    action_type: str
    details: Dict[str, Any]
    success: bool
    message: str

class CXResponse(BaseModel):
    email_id: str
    analysis: EmailAnalysis
    actions_taken: List[ActionTaken]
    response_email: str
    follow_up_questions: List[str]
    escalated: bool
    escalation_details: Optional[str] = None
    processing_time_ms: Optional[int] = None
