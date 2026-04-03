from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from agents.cx_agent import CXAgent
from api.models import EmailRequest, CXResponse

app = FastAPI(
    title="Zykrr Agentic CX Engine",
    description="Autonomous AI-powered customer experience engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = CXAgent()

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Zykrr CX Engine"}

@app.post("/api/process-email", response_model=CXResponse)
async def process_email(request: EmailRequest):
    try:
        result = await agent.process(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/actions/history")
async def get_history():
    return {"history": agent.action_log}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
