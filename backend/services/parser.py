import io
import pandas as pd
from fastapi import UploadFile, HTTPException
from docx import Document
import requests
from bs4 import BeautifulSoup

# Try importing Playwright, but make it optional so the app doesn't crash if it's missing during setup
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


async def parse_url(url: str) -> str:
    """Extracts text content from a given URL.
    Special handling is provided for Gemini share links which may need Playwright."""
    
    if not url.startswith('http'):
        url = 'https://' + url

    try:
        # First attempt: Simple HTTP GET request (fastest)
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.extract()
            
        text = soup.get_text(separator='\n')
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # For Gemini share links (g.co/gemini/share or gemini.google.com/share), 
        # the content might be dynamically loaded. If the text seems too short 
        # or doesn't contain the expected content, try Playwright.
        if ('gemini' in url and len(text) < 500) and PLAYWRIGHT_AVAILABLE:
            return await parse_url_with_playwright(url)
            
        return text

    except Exception as e:
        # Fallback to Playwright if standard requests fail
        if PLAYWRIGHT_AVAILABLE:
            return await parse_url_with_playwright(url)
        raise HTTPException(status_code=400, detail=f"Error parsing URL {url}: {str(e)}")


async def parse_url_with_playwright(url: str) -> str:
    """Fallback method using Playwright to render JavaScript-heavy pages."""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until='networkidle', timeout=15000)
            
            # Extract text from the body
            content = await page.evaluate("document.body.innerText")
            await browser.close()
            return content
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Playwright rendering failed for {url}: {str(e)}")


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
