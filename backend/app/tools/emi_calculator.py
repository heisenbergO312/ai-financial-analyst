from langchain_core.tools import tool

@tool
def calculate_no_cost_emi(principal: float, tenure_months: int) -> dict:
    """
    Calculates the No Cost EMI schedule for a given principal and tenure.
    
    Args:
        principal: The total principal amount of the loan.
        tenure_months: The number of months for the repayment tenure.
        
    Returns:
        A dictionary containing the monthly EMI, total interest (which is zero for no cost),
        and a schedule of expected payments.
    """
    if tenure_months <= 0:
        return {"error": "Tenure must be greater than 0 months."}
        
    monthly_installment = principal / tenure_months
    
    schedule = []
    remaining_balance = principal
    
    for month in range(1, tenure_months + 1):
        if month == tenure_months:
            # Adjust last installment to account for rounding errors
            payment = round(remaining_balance, 2)
        else:
            payment = round(monthly_installment, 2)
            
        remaining_balance -= payment
        
        schedule.append({
            "month": month,
            "payment_amount": payment,
            "principal_remaining": round(max(0, remaining_balance), 2)
        })
        
    return {
        "is_no_cost": True,
        "total_principal": principal,
        "monthly_installment": round(monthly_installment, 2),
        "total_interest_paid": 0.0,
        "tenure_months": tenure_months,
        "schedule": schedule
    }
