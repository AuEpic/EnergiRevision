import os

def evaluate_rules(lead_data):
    """
    Evaluates tax recovery rules for a given lead.
    Returns a list of identified opportunities.
    """
    opportunities = []
    
    # FoU-avdrag (R&D)
    if lead_data.get('category') == 'Tech/FoU' or 'tech' in str(lead_data.get('description', '')).lower():
        opportunities.append({
            'type': 'FoU-avdrag',
            'potential': 'High',
            'description': 'Potential for 20% R&D personnel cost reduction retroactively 6 years.'
        })

    # Energiskatt (Energy Tax)
    if lead_data.get('category') == 'Industri/Energi' or 'tillverkning' in str(lead_data.get('description', '')).lower():
        opportunities.append({
            'type': 'Energiskatt',
            'potential': 'Medium',
            'description': 'Reduction to 0.6 öre/kWh based on HFD 2022 ref. 38.'
        })

    # Moms (VAT)
    if 'fastighet' in str(lead_data.get('description', '')).lower() or 'brf' in str(lead_data.get('name', '')).lower():
        opportunities.append({
            'type': 'Momsåtervinning',
            'potential': 'High',
            'description': 'Opportunity to use "omsättningsmetoden" based on HFD 7071-24.'
        })

    return opportunities
