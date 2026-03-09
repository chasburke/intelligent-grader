import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
import uvicorn
from pydantic import BaseModel

from services.parser import parse_document, parse_spreadsheet, parse_url
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

async def resolve_input(text_content: str, file: Optional[UploadFile]) -> str:
    """Helper to concatenate file and text inputs, parsing URLs if present."""
    result = ""
    if file:
        result += await parse_document(file) + "\n\n"
    if text_content:
        # Check if text is a single URL
        if text_content.strip().startswith("http"):
             try:
                 url_text = await parse_url(text_content.strip())
                 result += f"[Content from {text_content.strip()}]:\n{url_text}\n\n"
             except Exception as e:
                 print(f"Failed to parse URL: {e}")
                 result += text_content + "\n\n"
        else:
             result += text_content + "\n\n"
    return result.strip()


@app.post("/api/assess", response_model=AssessmentResponse)
async def assess_submission(
    learning_objectives: str = Form(""),
    rubric: str = Form(""),
    instructions: str = Form(""),
    submission_text: str = Form(""), # Changed from required document to optional text/url
    learning_objectives_file: Optional[UploadFile] = File(None),
    rubric_file: Optional[UploadFile] = File(None),
    instructions_file: Optional[UploadFile] = File(None),
    document: Optional[UploadFile] = File(None),
    spreadsheet: Optional[UploadFile] = File(None)
):
    try:
        # 1. Resolve Inputs (Combine text/URLs with File Uploads)
        final_objectives = await resolve_input(learning_objectives, learning_objectives_file)
        final_rubric = await resolve_input(rubric, rubric_file)
        final_instructions = await resolve_input(instructions, instructions_file)
        
        # 2. Parse the primary submission (can be text, a Gemini link, or a doc file)
        doc_content = await resolve_input(submission_text, document)
        
        if not doc_content:
             raise HTTPException(status_code=400, detail="Must provide either submission text/url or a document.")

        # 3. Parse the spreadsheet if provided
        spreadsheet_data = None
        if spreadsheet:
            spreadsheet_data = await parse_spreadsheet(spreadsheet)
            
        # 4. Call the Grader Service (LLM)
        result = await grade_submission(
            learning_objectives=final_objectives,
            rubric=final_rubric,
            instructions=final_instructions,
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
