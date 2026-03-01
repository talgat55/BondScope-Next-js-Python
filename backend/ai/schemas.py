"""
Pydantic schemas for AI report and chat endpoints.
"""
from pydantic import BaseModel, Field


class ReportRequest(BaseModel):
    timeframe: str | None = Field(default=None, description="Optional timeframe for report context")


class ReportResponse(BaseModel):
    summary_md: str
    bullets: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    questions_to_check: list[str] = Field(default_factory=list)
    disclaimer: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    answer_md: str
    disclaimer: str
