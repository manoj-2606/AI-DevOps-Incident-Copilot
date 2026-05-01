from fastapi import APIRouter

router = APIRouter()

@router.get("/history")
def get_history():
    return {"incidents": [], "message": "History coming in Phase 2"}