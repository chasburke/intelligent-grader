import io
import pandas as pd
from fastapi import UploadFile, HTTPException
from docx import Document

async def parse_document(file: UploadFile) -> str:
    """Extracts text content from a .docx or .txt file."""
    content = ""
    file_bytes = await file.read()
    
    if file.filename.endswith('.docx'):
        try:
            doc = Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                content += para.text + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing DOCX: {str(e)}")
            
    elif file.filename.endswith('.txt'):
        try:
            content = file_bytes.decode('utf-8')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing TXT: {str(e)}")
            
    else:
        raise HTTPException(status_code=400, detail="Unsupported document format. Please upload .docx or .txt")
        
    # Reset internal file pointer in case it needs to be read again
    await file.seek(0)
    return content


async def parse_spreadsheet(file: UploadFile) -> str:
    """
    Parses a spreadsheet (.csv, .xlsx)
    Returns a markdown representation of the first sheet/dataframe for the LLM context.
    For large spreadsheets, this might need downsampling or summary statistics instead.
    """
    file_bytes = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            raise HTTPException(status_code=400, detail="Unsupported spreadsheet format. Please upload .csv or .xlsx")
            
        # For LLM context, converting to a markdown table is usually effective.
        # We limit to first 100 rows to avoid token overflow.
        # If the actual use case requires full data, we would compute stats here instead.
        markdown_data = df.head(100).to_markdown()
        
        # Reset pointer
        await file.seek(0)
        return markdown_data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing Spreadsheet: {str(e)}")
