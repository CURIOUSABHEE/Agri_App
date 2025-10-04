#!/usr/bin/env python3
"""
Test Dynamic User Registration and Authentication
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_dynamic_users():
    """Test that different users get different names dynamically"""
    
    # Test users data
    test_users = [
        {
            "phone": "+919876543210",
            "name": "Abhishek Farmer",
            "district": "Kottayam"
        },
        {
            "phone": "+919876543211", 
            "name": "Priya Farmer",
            "district": "Ernakulam"
        },
        {
            "phone": "+919876543212",
            "name": "Rajesh Kumar",
            "district": "Thrissur"
        }
    ]
    
    registered_users = []
    
    print("🧪 Testing Dynamic User Registration...")
    
    for i, user in enumerate(test_users):
        print(f"\n--- Registering User {i+1}: {user['name']} ---")
        
        # Step 1: Send OTP
        otp_response = requests.post(f"{BASE_URL}/api/auth/send-otp", 
                                   json={"phone": user["phone"]})
        
        if otp_response.status_code == 200:
            otp_data = otp_response.json()
            dev_otp = otp_data.get("dev_otp")
            print(f"✅ OTP sent to {user['phone']}: {dev_otp}")
            
            # Step 2: Verify OTP and register
            verify_response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
                "phone": user["phone"],
                "otp": dev_otp,
                "farmer_name": user["name"],
                "district": user["district"],
                "language": "en"
            })
            
            if verify_response.status_code == 200:
                auth_data = verify_response.json()
                print(f"✅ User registered: {auth_data['farmer_data']['name']}")
                registered_users.append({
                    "token": auth_data["access_token"],
                    "data": auth_data["farmer_data"]
                })
            else:
                print(f"❌ Registration failed: {verify_response.text}")
        else:
            print(f"❌ OTP failed: {otp_response.text}")
    
    print(f"\n📊 Successfully registered {len(registered_users)} users")
    
    # Test profile fetching for each user
    print("\n🔍 Testing Profile Fetching...")
    for i, user in enumerate(registered_users):
        profile_response = requests.get(f"{BASE_URL}/api/auth/profile",
                                      headers={"Authorization": f"Bearer {user['token']}"})
        
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            print(f"✅ Profile {i+1}: {profile_data['name']} from {profile_data['district']}")
        else:
            print(f"❌ Profile fetch failed: {profile_response.text}")
    
    # List all farmers
    print("\n👥 All Registered Farmers:")
    farmers_response = requests.get(f"{BASE_URL}/api/auth/farmers")
    if farmers_response.status_code == 200:
        farmers_data = farmers_response.json()
        print(f"Total farmers: {farmers_data['total_farmers']}")
        for farmer in farmers_data['farmers']:
            print(f"  - {farmer['name']} ({farmer['phone']}) from {farmer['district']}")
    
    print("\n🎉 Dynamic user test completed!")

if __name__ == "__main__":
    try:
        test_dynamic_users()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Please start the server first:")
        print("   cd /Users/apple/Desktop/Agri_App/backend && python3 main.py")