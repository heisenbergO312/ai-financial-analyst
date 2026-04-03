import pdfplumber
import google.generativeai as genai
import os
import json
import io
import pikepdf
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

def parse_bank_statement(pdf_bytes: bytes, password: str = None):
    """
    Extracts text from a bank statement (handling encryption) and uses Gemini 
    to categorize transactions into Housing, Food, Entertainment, etc.
    """
    text = ""
    
    try:
        # Check if the PDF is encrypted and unlock if necessary
        try:
            print(f"DEBUG: Attempting to open PDF. Password provided: {'Yes' if password else 'No'}")
            with pikepdf.open(io.BytesIO(pdf_bytes), password=password) as pdf:
                print("DEBUG: PDF opened successfully with pikepdf.")
                # Create a decrypted copy in memory for pdfplumber
                decrypted_pdf = io.BytesIO()
                pdf.save(decrypted_pdf)
                decrypted_pdf.seek(0)
                
                with pdfplumber.open(decrypted_pdf) as pl:
                    for page in pl.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
        except pikepdf.PasswordError:
            print("DEBUG: pikepdf raised PasswordError.")
            raise ValueError("Incorrect password provided for the bank statement PDF.")
        except Exception as e:
            print(f"DEBUG: pikepdf failed with error: {str(e)}. Falling back to direct pdfplumber.")
            # Fallback to standard pdfplumber (maybe it wasn't encrypted after all)
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pl:
                for page in pl.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"

        if not text.strip():
            # If no text extracted, try to use Gemini directly on the PDF bytes (experimental)
            raise ValueError("No readable text found in PDF. Is it a scanned image?")

        # Construct prompt for categorization
        prompt = f"""
        Analyze the following bank statement text and categorize every transaction into these EXACT labels:
        'Housing', 'Food & Dining', 'Entertainment', 'Savings & Investments', 'Transport', 'Healthcare', 'Shopping', 'Utilities', 'Others'.

        Return ONLY a JSON object with:
        1. 'statement_month': Month number (1-12) the statement covers.
        2. 'statement_year': Year (e.g. 2026) the statement covers.
        3. 'category_totals': A mapping of category names to the total sum spent (INR).
        4. 'transactions': A list of objects with 'date', 'description', 'amount', 'category'.
        5. 'transaction_count': Total number of transactions found.
        6. 'estimated_income': The most likely monthly salary/stable income (INR).

        Salary Detection Logic:
        - Analyze ONLY Credit (CR/Inward) transactions.
        - Look for recurring high-value credits landing between the 25th and 5th.
        - If no clear salary is found, estimate from all significant inward cash flows.

        Note: Look for phrases like "as on February 28, 2026" or "Statement for March 2026" in the first 2000 characters to determine the month and year.

        Ensure all numbers are floats.
        
        Text:
        {text[:20000]}  # Clip to stay within reasonable token limits
        """

        response = model.generate_content(prompt)
        
        # Clean the response (Gemini sometimes adds markdown blocks)
        cleaned_json = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(cleaned_json)

    except Exception as e:
        if "password" in str(e).lower() or isinstance(e, ValueError):
             raise e
        raise Exception(f"AI parsing failed: {str(e)}")
