from pydantic import BaseModel
from typing import Optional

class AnalyzeRequest(BaseModel):
    log: str
    api_key: str

class IncidentResponse(BaseModel):
    root_cause: str
    fix: str
    severity: str