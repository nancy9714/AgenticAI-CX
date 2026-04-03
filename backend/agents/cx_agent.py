import json
import uuid
import time
import os
from typing import List, Dict, Any, Tuple
import anthropic

from api.models import (
    EmailRequest, CXResponse, EmailAnalysis,
    ActionTaken, Intent, Urgency, EmotionalTone
)
from tools.actions import TOOLS, execute_tool

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

ANALYZER_PROMPT = """You are an expert Customer Experience analyst for Zykrr, a SaaS platform.

Analyze the incoming customer email and return a JSON object with EXACTLY this structure:
{
  "intent": one of ["refund_request","complaint","query","cancellation","appreciation","callback_request","escalation","other"],
  "urgency": one of ["high","medium","low"],
  "emotional_tone": one of ["angry","frustrated","sad","neutral","satisfied","anxious"],
  "summary": "1-2 sentence summary of the issue",
  "key_issues": ["list", "of", "specific", "issues"],
  "requires_escalation": true/false,
  "escalation_reason": "reason if escalation needed, else null",
  "missing_info": ["info items needed to resolve, if any"],
  "sentiment_score": float between -1.0 (very negative) and 1.0 (very positive)
}

ESCALATION triggers: legal threats, abuse/harassment, fraud suspicion, safety concerns, VIP complaint, repeated failures (3+).
Return ONLY valid JSON, no markdown, no explanation."""

RESPONDER_PROMPT = """You are Aria, the AI Customer Experience agent for Zykrr.

Your personality: warm, empathetic, direct, solution-focused. Never robotic. Never over-apologetic.

You have already analyzed the customer's email and taken actions. Now write a response email that:
1. Acknowledges their specific issue (use their name if available)
2. Clearly states what actions were taken (refund processed, callback scheduled, etc.)
3. Asks any necessary follow-up questions naturally within the email
4. Is concise (150-250 words max)
5. Ends with next steps and a trust-building statement

Tone calibration:
- angry/frustrated customer → extra empathy, concrete actions front-loaded
- neutral/query → professional and efficient
- appreciation → warm and genuine

NEVER: use "I apologize for the inconvenience", generic platitudes, or mention you are AI unless asked.
Sign off as: "Aria | Zykrr Customer Experience"

Return ONLY the email body text, no subject line."""


class CXAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.action_log: List[Dict] = []

    async def process(self, request: EmailRequest) -> CXResponse:
        start_time = time.time()
        email_id = request.email_id or f"EMAIL-{uuid.uuid4().hex[:8].upper()}"

        # Step 1: Analyze the email
        analysis = await self._analyze_email(request)

        # Step 2: Run agentic action loop
        actions_taken, follow_up_questions, escalated, escalation_details = \
            await self._run_action_agent(request, analysis)

        # Step 3: Generate response email
        response_email = await self._generate_response(
            request, analysis, actions_taken, follow_up_questions
        )

        # Step 4: Log
        processing_ms = int((time.time() - start_time) * 1000)
        self.action_log.append({
            "email_id": email_id,
            "from": request.from_email,
            "intent": analysis.intent,
            "urgency": analysis.urgency,
            "actions": [a.action_type for a in actions_taken],
            "escalated": escalated,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        })

        return CXResponse(
            email_id=email_id,
            analysis=analysis,
            actions_taken=actions_taken,
            response_email=response_email,
            follow_up_questions=follow_up_questions,
            escalated=escalated,
            escalation_details=escalation_details,
            processing_time_ms=processing_ms
        )

    async def _analyze_email(self, request: EmailRequest) -> EmailAnalysis:
        email_text = f"""
From: {request.from_email}
Customer Name: {request.customer_name or 'Unknown'}
Subject: {request.subject}
Order ID: {request.order_id or 'Not provided'}
Body:
{request.body}
"""
        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=ANALYZER_PROMPT,
            messages=[{"role": "user", "content": email_text}]
        )

        raw = response.content[0].text.strip()
        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)

        return EmailAnalysis(
            intent=data["intent"],
            urgency=data["urgency"],
            emotional_tone=data["emotional_tone"],
            summary=data["summary"],
            key_issues=data["key_issues"],
            requires_escalation=data["requires_escalation"],
            escalation_reason=data.get("escalation_reason"),
            missing_info=data.get("missing_info", []),
            sentiment_score=float(data["sentiment_score"])
        )

    async def _run_action_agent(
        self, request: EmailRequest, analysis: EmailAnalysis
    ) -> Tuple[List[ActionTaken], List[str], bool, str | None]:

        actions_taken: List[ActionTaken] = []
        follow_up_questions: List[str] = []
        escalated = False
        escalation_details = None

        system_prompt = """You are the action-taking agent for Zykrr's CX Engine.

Based on the email analysis, autonomously call the appropriate tools to resolve this customer issue.

RULES:
1. Always call process_refund if intent is refund_request and order_id is present
2. Always call send_apology if emotional_tone is angry or frustrated
3. Call schedule_callback if customer asked for a call or urgency is high
4. Call escalate_to_human for: legal threats, abuse, fraud, safety, or if requires_escalation is true
5. Call ask_followup if missing_info list is not empty
6. CUSTOM RULE: Call apply_goodwill_credit ($25) when sentiment_score < -0.6 AND intent is complaint — this is Zykrr's proactive trust recovery
7. You may call multiple tools. Call only what's needed.
8. Do NOT call tools that don't apply."""

        context = f"""Email Analysis:
- Intent: {analysis.intent}
- Urgency: {analysis.urgency}
- Emotional Tone: {analysis.emotional_tone}
- Sentiment Score: {analysis.sentiment_score}
- Summary: {analysis.summary}
- Key Issues: {', '.join(analysis.key_issues)}
- Requires Escalation: {analysis.requires_escalation}
- Escalation Reason: {analysis.escalation_reason or 'N/A'}
- Missing Info: {', '.join(analysis.missing_info) if analysis.missing_info else 'None'}

Customer Email Details:
- From: {request.from_email}
- Name: {request.customer_name or 'Unknown'}
- Order ID: {request.order_id or 'Not provided'}
- Subject: {request.subject}

Decide which tools to call to best resolve this."""

        messages = [{"role": "user", "content": context}]

        # Agentic loop — keep going until no more tool calls
        while True:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                system=system_prompt,
                tools=TOOLS,
                messages=messages
            )

            # Collect tool uses from this response
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            if not tool_uses:
                break

            # Execute each tool
            tool_results = []
            for tool_use in tool_uses:
                result = execute_tool(tool_use.name, tool_use.input)

                # Build ActionTaken
                action = ActionTaken(
                    action_type=tool_use.name,
                    details={**tool_use.input, **result},
                    success=result.get("success", False),
                    message=result.get("message", "")
                )
                actions_taken.append(action)

                # Track escalation
                if tool_use.name == "escalate_to_human":
                    escalated = True
                    escalation_details = tool_use.input.get("reason")

                # Collect follow-up questions
                if tool_use.name == "ask_followup":
                    missing = tool_use.input.get("missing_info", [])
                    follow_up_questions.extend(missing)

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": json.dumps(result)
                })

            # Continue conversation with tool results
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})

            # Stop if model finished
            if response.stop_reason == "end_turn":
                break

        return actions_taken, follow_up_questions, escalated, escalation_details

    async def _generate_response(
        self,
        request: EmailRequest,
        analysis: EmailAnalysis,
        actions_taken: List[ActionTaken],
        follow_up_questions: List[str]
    ) -> str:

        actions_summary = "\n".join([
            f"- {a.action_type}: {a.message}" for a in actions_taken
        ]) or "No autonomous actions taken."

        fup_summary = "\n".join([f"- {q}" for q in follow_up_questions]) if follow_up_questions else "None"

        prompt = f"""Write a customer response email for this situation:

Customer: {request.customer_name or request.from_email}
Issue Summary: {analysis.summary}
Emotional Tone: {analysis.emotional_tone}
Intent: {analysis.intent}

Actions already taken by the system:
{actions_summary}

Follow-up questions to ask (weave naturally into email):
{fup_summary}

Original email subject: {request.subject}"""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=RESPONDER_PROMPT,
            messages=[{"role": "user", "content": prompt}]
        )

        return response.content[0].text.strip()
