from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, history

app = FastAPI(title="AI DevOps Incident Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(history.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "running"}