from fastapi import APIRouter, HTTPException
from models.incident import AnalyzeRequest, IncidentResponse
from services.ai_service import analyze_log

router = APIRouter()

@router.post("/analyze", response_model=IncidentResponse)
async def analyze(req: AnalyzeRequest):
    if not req.api_key:
        raise HTTPException(status_code=400, detail="API key required")
    if not req.log:
        raise HTTPException(status_code=400, detail="Log content required")

    result = analyze_log(req.log, req.api_key)
    return result