import os

def score_lead(lead_data):
    """
    Scores a lead from 1-10 based on recovery potential.
    """
    score = 5 # Baseline
    
    # Legal verify (Top priority)
    if lead_data.get('status') == 'Verified':
        return 10
        
    # Category based scoring
    category = lead_data.get('category', '')
    if category == 'Tech/FoU':
        score += 2
    elif category == 'Industri/Energi':
        score += 1
        
    # Financial indicators (Mocked logic for now)
    potential = lead_data.get('potentialMsek', 0)
    if potential > 10:
        score += 2
    elif potential > 1:
        score += 1
        
    # Max score is 10
    return min(10, score)
