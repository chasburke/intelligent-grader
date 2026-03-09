import os
import json
import google.generativeai as genai
from fastapi import HTTPException
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# We expect the user to have GOOGLE_API_KEY set in their environment
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    # We won't block startup, but we'll flag it during a request
    print("Warning: GOOGLE_API_KEY not found in environment.")
else:
    genai.configure(api_key=api_key)

async def grade_submission(
    learning_objectives: str,
    rubric: str,
    instructions: str,
    student_text: str,
    spreadsheet_data: str = None
) -> dict:
    
    if not os.getenv("GOOGLE_API_KEY"):
        raise HTTPException(status_code=500, detail="Google API Key is not configured on the server.")

    # We use Gemini Pro
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # Construct the Prompt
    prompt = f"""
    You are an expert academic grader. Assess the following student submission based on the provided Learning Objectives, Rubric, and Instructions.
    
    **Learning Objectives:**
    {learning_objectives}
    
    **Rubric:**
    {rubric}
    
    **Instructions to Grader:**
    {instructions}
    
    **Student Submission (Document, Text, or Extracted Link Content):**
    {student_text}
    """
    
    if spreadsheet_data:
        prompt += f"""
        
    **Student Supporting Spreadsheet Data (First 100 rows):**
    {spreadsheet_data}
        
    **Crucial Instruction**: The student has provided a spreadsheet as supporting evidence. 
    You must cross-reference their claims in the "Student Written Report Submission" with the "Student Supporting Spreadsheet Data" below.
    Specifically point out in your `cross_verification` section if the metrics, formulas, or conclusions they cite in their report actually match the dataset they provided.
    """
    
    prompt += """
    
    **Output Format Requirement:**
    You must respond in valid JSON format ONLY. Do not use Markdown wrappers (like ```json), just output the raw JSON string. The JSON object must have exactly the following keys:
    - "score": A string representing the final grade based on the rubric (e.g., "85/100", "B+", etc).
    - "feedback": A detailed string of feedback explaining the score, strengths, and weaknesses. (You may use markdown formatting within this string).
    - "cross_verification": A string detailing how well the findings in their written report align with their provided spreadsheet data. If no spreadsheet was provided, explicitly state that.
    """
    
    try:
         # Configuration for safer and more deterministic JSON generation
        generation_config = genai.types.GenerationConfig(
            temperature=0.2, # Lower temperature for more analytical tasks
        )
        
        response = model.generate_content(prompt, generation_config=generation_config)
        
        # Parse the JSON response
        # Sometimes models wrap the JSON in markdown code blocks despite instructions, so we clean it
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        parsed_response = json.loads(response_text)
        return parsed_response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during AI Grading process: {str(e)}")
