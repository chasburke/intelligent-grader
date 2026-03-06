import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
import uvicorn
from pydantic import BaseModel

from services.parser import parse_document, parse_spreadsheet
from services.grader import grade_submission

app = FastAPI(title="Intelligent Grader API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AssessmentResponse(BaseModel):
    score: str
    feedback: str
    cross_verification: str

@app.post("/api/assess", response_model=AssessmentResponse)
async def assess_submission(
    learning_objectives: str = Form(...),
    rubric: str = Form(...),
    instructions: str = Form(...),
    document: UploadFile = File(...),
    spreadsheet: Optional[UploadFile] = File(None)
):
    try:
        # 1. Parse the text document submission
        doc_content = await parse_document(document)
        
        # 2. Parse the spreadsheet if provided
        spreadsheet_data = None
        if spreadsheet:
            spreadsheet_data = await parse_spreadsheet(spreadsheet)
            
        # 3. Call the Grader Service (LLM)
        result = await grade_submission(
            learning_objectives=learning_objectives,
            rubric=rubric,
            instructions=instructions,
            student_text=doc_content,
            spreadsheet_data=spreadsheet_data
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
