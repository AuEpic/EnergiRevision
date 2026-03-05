import os
import sqlite3
import json
import re
from datetime import datetime
import lead_scoring
import rules_engine

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'EnergiRevision', 'data', 'openrevision.db')
KNOWLEDGE_PATH = os.path.join(BASE_DIR, 'KNOWLEDGE.txt')
EXPORT_PATH_VITE = os.path.join(BASE_DIR, 'EnergiRevision', 'public', 'data.json')
EXPORT_PATH_ROOT = os.path.join(BASE_DIR, 'public', 'data.json')

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def parse_knowledge_leads():
    """Extract leads from KNOWLEDGE.txt"""
    leads = []
    if not os.path.exists(KNOWLEDGE_PATH):
        return leads
        
    with open(KNOWLEDGE_PATH, 'r') as f:
        content = f.read()
        
    # Simple regex to find names and descriptions in the leads section
    # Looking for lines like "Electrum Automation AB: ..."
    matches = re.finditer(r'([A-Z][\w\.\s]+(?:AB|Group|Inc|AI)):\s*(.*)', content)
    for match in matches:
        name = match.group(1).strip()
        description = match.group(2).strip()
        
        # Determine category based on keywords
        category = 'General'
        if any(kw in name.lower() or kw in description.lower() for kw in ['fou', 'tech', 'automation', 'it', 'software']):
            category = 'Tech/FoU'
        elif any(kw in name.lower() or kw in description.lower() for kw in ['industri', 'energi', 'el', 'kraft', 'manufacturing']):
            category = 'Industri/Energi'
            
        leads.append({
            'name': name,
            'description': description,
            'category': category
        })
    return leads

def sync():
    print(f"[*] Starting sync at {datetime.now()}")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Log start
    cursor.execute("INSERT INTO activity_log (level, message, source) VALUES (?, ?, ?)", 
                   ('INFO', 'Engine sync started', 'engine'))
    
    leads_to_sync = parse_knowledge_leads()
    processed = 0
    added = 0
    updated = 0
    
    for lead in leads_to_sync:
        processed += 1
        name = lead['name']
        description = lead['description']
        category = lead['category']
        
        # Generate a semi-stable ID
        id_hash = str(abs(hash(name)) % 10000)
        lead_id = f"L{id_hash}"
        
        score = lead_scoring.score_lead(lead)
        opportunities = rules_engine.evaluate_rules(lead)
        potential = "Unknown"
        if opportunities:
            potential = opportunities[0]['description']

        # Check if exists
        cursor.execute("SELECT score FROM leads WHERE id = ?", (lead_id,))
        row = cursor.fetchone()
        
        if not row:
            cursor.execute("""
                INSERT INTO leads (id, name, industry, score, potential, notes, source, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (lead_id, name, category, score, potential, description, 'engine', 'New'))
            added += 1
        else:
            old_score = row[0]
            new_score = max(old_score, score)
            cursor.execute("""
                UPDATE leads SET 
                score = ?, 
                potential = ?, 
                notes = ?,
                updated_at = datetime('now')
                WHERE id = ?
            """, (new_score, potential, description, lead_id))
            updated += 1
            
    # Export to JSON
    cursor.execute("SELECT * FROM leads WHERE deleted_at IS NULL")
    cols = [column[0] for column in cursor.description]
    leads_rows = cursor.fetchall()
    leads_data = []
    for row in leads_rows:
        lead_dict = dict(zip(cols, row))
        # Parse tags if they are JSON strings (though we aren't using them much here)
        try:
            lead_dict['tags'] = json.loads(lead_dict.get('tags', '[]'))
        except:
            lead_dict['tags'] = []
        leads_data.append(lead_dict)
        
    # Stats for JSON
    cursor.execute("SELECT COUNT(*) FROM leads WHERE deleted_at IS NULL")
    total_leads = cursor.fetchone()[0]
    
    export_data = {
        'last_updated': datetime.now().isoformat(),
        'total_leads': total_leads,
        'leads': leads_data
    }
    
    for path in [EXPORT_PATH_VITE, EXPORT_PATH_ROOT]:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(export_data, f, indent=2)
            
    # Log finish
    cursor.execute("INSERT INTO activity_log (level, message, source) VALUES (?, ?, ?)", 
                   ('SUCCESS', f'Sync completed: {added} added, {updated} updated', 'engine'))
    
    conn.commit()
    conn.close()
    print(f"[+] Sync finished. Added: {added}, Updated: {updated}")

if __name__ == "__main__":
    sync()
