"""
Enhanced In-Memory Storage with File Backup for Agricultural Platform
Ensures data persistence even without MongoDB
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

class FarmerStorage:
    def __init__(self, backup_file="farmers_data.json"):
        self.backup_file = backup_file
        self.farmers = {}
        self.load_from_backup()
    
    def load_from_backup(self):
        """Load farmers data from backup file"""
        try:
            if os.path.exists(self.backup_file):
                with open(self.backup_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Convert string dates back to datetime objects
                    for farmer_id, farmer_data in data.items():
                        if isinstance(farmer_data.get('registration_date'), str):
                            farmer_data['registration_date'] = datetime.fromisoformat(farmer_data['registration_date'])
                        if isinstance(farmer_data.get('last_active'), str):
                            farmer_data['last_active'] = datetime.fromisoformat(farmer_data['last_active'])
                        self.farmers[farmer_id] = farmer_data
                    print(f"✅ Loaded {len(self.farmers)} farmers from backup")
        except Exception as e:
            print(f"⚠️  Could not load backup: {e}")
    
    def save_to_backup(self):
        """Save farmers data to backup file"""
        try:
            # Convert datetime objects to strings for JSON serialization
            backup_data = {}
            for farmer_id, farmer_data in self.farmers.items():
                serializable_data = farmer_data.copy()
                if isinstance(farmer_data.get('registration_date'), datetime):
                    serializable_data['registration_date'] = farmer_data['registration_date'].isoformat()
                if isinstance(farmer_data.get('last_active'), datetime):
                    serializable_data['last_active'] = farmer_data['last_active'].isoformat()
                backup_data[farmer_id] = serializable_data
            
            with open(self.backup_file, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            print(f"💾 Saved {len(self.farmers)} farmers to backup")
        except Exception as e:
            print(f"❌ Could not save backup: {e}")
    
    def save_farmer(self, farmer_data: Dict[str, Any]) -> bool:
        """Save or update farmer data"""
        try:
            farmer_id = farmer_data["farmer_id"]
            self.farmers[farmer_id] = farmer_data
            self.save_to_backup()
            print(f"✅ Farmer saved: {farmer_data['name']} ({farmer_data['phone']})")
            return True
        except Exception as e:
            print(f"❌ Error saving farmer: {e}")
            return False
    
    def get_farmer_by_id(self, farmer_id: str) -> Optional[Dict[str, Any]]:
        """Get farmer by ID"""
        return self.farmers.get(farmer_id)
    
    def get_farmer_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """Get farmer by phone number"""
        for farmer_data in self.farmers.values():
            if farmer_data.get("phone") == phone:
                return farmer_data
        return None
    
    def get_all_farmers(self) -> list:
        """Get all farmers"""
        return list(self.farmers.values())
    
    def update_last_active(self, farmer_id: str):
        """Update farmer's last active timestamp"""
        if farmer_id in self.farmers:
            self.farmers[farmer_id]["last_active"] = datetime.now()
            self.save_to_backup()

# Global storage instance
farmer_storage = FarmerStorage()