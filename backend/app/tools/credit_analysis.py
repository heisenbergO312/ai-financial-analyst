from langchain_core.tools import tool
import random

@tool
def get_cibil_insights(credit_score: int, utilization_ratio: float, missing_payments: int) -> str:
    """
    Provides insights on factors affecting CIBIL scores based on structured data.
    
    Args:
        credit_score: The current CIBIL score (300-900).
        utilization_ratio: The credit utilization ratio as a decimal (e.g., 0.35 for 35%).
        missing_payments: The number of missed payments in the last 12 months.
        
    Returns:
        A formatted string with comprehensive financial advice and insights on the score.
    """
    insights = []
    
    # Analyze the overall score category
    if credit_score >= 750:
        insights.append(f"Excellent Score ({credit_score}): You are in a prime position for new credit. Banks will offer favorable interest rates.")
    elif credit_score >= 700:
        insights.append(f"Good Score ({credit_score}): You have a healthy credit profile. You qualify for most loans but maybe not the best promotional rates.")
    elif credit_score >= 650:
        insights.append(f"Fair Score ({credit_score}): Lenders may view you as moderate risk. Consider improving your score before applying for major loans.")
    else:
        insights.append(f"Poor Score ({credit_score}): High risk for lenders. Focus immediately on basic credit building habits.")

    # Analyze utilization ratio
    if utilization_ratio > 0.30:
        insights.append(f"- High Utilization Alert: Your credit utilization is {utilization_ratio*100}%. Keeping this below 30% strongly boosts your score. Consider paying off balances early or requesting a credit limit increase.")
    else:
        insights.append(f"- Healthy Utilization: Your credit utilization is {utilization_ratio*100}%, which is excellent and positively impacts your score.")
        
    # Analyze missing payments
    if missing_payments > 0:
        insights.append(f"- Payment History Warning: You have {missing_payments} missed payment(s). Payment history is the biggest factor (35%) in your CIBIL score. Set up autopay to prevent future instances.")
    else:
        insights.append("- Excellent Payment History: No missed payments recently. Keep this up as it forms the foundation of a strong credit profile.")
        
    return "\n".join(insights)
