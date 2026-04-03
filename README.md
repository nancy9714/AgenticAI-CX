# Zykrr Agentic CX Engine

An autonomous AI-powered Customer Experience engine that reads incoming customer emails, understands intent and emotion, and takes real actions — all at machine speed.

---

## Architecture Overview

```
Incoming Email (POST /api/process-email)
        │
        ▼
┌─────────────────────┐
│   Analyzer Agent    │  → Extracts: intent, urgency, tone,
│  (Claude Sonnet 4)  │    sentiment score, key issues
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│   Decision Agent    │  → Agentic tool-calling loop
│  (Claude + Tools)   │    decides which actions to take
└─────────────────────┘
        │
   ┌────┼────┬────────┬────────────┐
   ▼    ▼    ▼        ▼            ▼
Refund Apology Callback Escalate  Goodwill
                                  Credit
        │
        ▼
┌─────────────────────┐
│   Response Builder  │  → Writes human-quality reply email
│  (Claude Sonnet 4)  │    signed as "Aria | Zykrr CX"
└─────────────────────┘
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Anthropic API key ([get one here](https://console.anthropic.com))

### 1. Clone & configure

```bash
git clone <repo-url>
cd zykrr-cx-engine
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Run with Docker

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 3. Run without Docker (development)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your_key_here
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## API Reference

### POST `/api/process-email`

```json
{
  "from_email": "customer@example.com",
  "customer_name": "John Doe",
  "subject": "I want a refund",
  "body": "Your service is terrible...",
  "order_id": "ORD-12345"
}
```

**Response:**
```json
{
  "email_id": "EMAIL-AB12CD34",
  "analysis": {
    "intent": "refund_request",
    "urgency": "high",
    "emotional_tone": "angry",
    "sentiment_score": -0.85,
    "summary": "...",
    "key_issues": [...],
    "requires_escalation": false
  },
  "actions_taken": [
    { "action_type": "process_refund", "success": true, "message": "..." },
    { "action_type": "send_apology", "success": true, "message": "..." }
  ],
  "response_email": "Dear John...",
  "follow_up_questions": [],
  "escalated": false,
  "processing_time_ms": 3200
}
```

---

## Design Notes

### Agent Architecture
The engine uses a **two-stage agentic pattern**:

1. **Analyzer** (structured extraction): A dedicated LLM call with a strict JSON prompt extracts a clean `EmailAnalysis` object. This separation ensures reliable structured output before any actions are taken.

2. **Decision Agent** (agentic loop): Claude uses tool-calling in a loop, deciding autonomously which combination of actions to take. The loop continues until Claude signals `end_turn` with no pending tool calls. This enables multi-action responses (e.g., refund + apology + goodwill credit simultaneously).

3. **Response Builder**: A separate, persona-driven call generates the customer-facing reply. Keeping it separate from the decision loop means the response always reflects what was actually done.

### Why Claude for the Entire Stack?
- Tool-calling natively supports multi-step agentic behavior
- Emotional tone + nuanced language understanding exceeds keyword classifiers
- The same model handles analysis, decision, and generation — no hand-offs

### Prompt Design
- Analyzer uses strict JSON schema instructions with explicit enum constraints
- Decision agent uses rule-based instructions embedded in the system prompt (matching the 6 defined triggers) to guide but not override Claude's judgment
- Response builder has a persona ("Aria") and explicit anti-patterns (no "I apologize for the inconvenience")

---

## Custom Rule

**Goodwill Credit Rule** (`apply_goodwill_credit` tool):

> When `sentiment_score < -0.6` AND `intent == "complaint"`, the agent automatically applies a $25 goodwill credit to the customer account.

**Rationale:** This rule operationalizes Zykrr's core goal of "turning complaints into trust recovery moments." A highly negative complaint (not just a query or escalation) represents a customer at churn risk. A proactive $25 credit — applied before the customer asks — signals that Zykrr takes responsibility rather than waiting to be pushed. The threshold of -0.6 avoids triggering on mild frustration; it targets genuinely distressed customers.

---

## Running Tests

```bash
cd backend
pytest tests/ -v

# Unit tests only (no API key needed):
pytest tests/ -v -m "not integration"

# All tests including integration (requires ANTHROPIC_API_KEY):
pytest tests/ -v
```

### Test Coverage
| Test Category | Count | Description |
|---|---|---|
| Model Validation | 3 | Pydantic model schema tests |
| Tool Execution | 6 | Each tool's mock output |
| Custom Rule Logic | 2 | Goodwill credit trigger conditions |
| Integration | 2 | Full pipeline (requires API key) |

---

## Reflection

**What worked well:**
- Separating analysis from action-taking made each stage easier to test and debug independently
- Claude's tool-calling is a natural fit for this problem — the model inherently understands that "angry + refund context → trigger refund + apology" without explicit if-else chains
- The custom goodwill credit rule is cleanly handled as just another tool with a system-prompt trigger condition

**What I'd do differently with more time:**
- Replace mock tools with real integrations (Stripe for refunds, Calendly for callbacks, SendGrid for email delivery)
- Add a vector database to detect repeat customers and trigger escalation after 3+ issues
- Implement streaming responses for the frontend so users see results progressively
- Add a feedback loop: human agents can rate AI decisions, feeding back into prompt refinement

**Challenges:**
- Ensuring JSON extraction is reliable across varied email formats required both schema instructions and a fallback strip for markdown fences
- The agentic loop needed a clear exit condition to prevent infinite tool calls — Claude's `stop_reason: end_turn` handles this cleanly

---

## Project Structure

```
zykrr-cx-engine/
├── backend/
│   ├── agents/
│   │   └── cx_agent.py       # Core agentic logic
│   ├── api/
│   │   └── models.py         # Pydantic request/response models
│   ├── tools/
│   │   └── actions.py        # Tool definitions + mock executors
│   ├── tests/
│   │   └── test_cx_engine.py # Unit + integration tests
│   ├── main.py               # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmailForm.js  # Email input form
│   │   │   ├── ResultPanel.js# Results display
│   │   │   └── Header.js     # App header
│   │   ├── App.js            # Main app + sample emails
│   │   └── index.js
│   ├── public/index.html
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```
