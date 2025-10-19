#!/usr/bin/env python3
"""
Simple Soil API Test
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def simple_test():
    try:
        print("🔍 Environment check...")
        api_key = os.getenv("SOIL_DATA_API")
        print(f"API Key configured: {'Yes' if api_key else 'No'}")
        
        if not api_key:
            print("❌ SOIL_DATA_API not found in .env file")
            return
        
        print(f"API Key (masked): {api_key[:10]}...{api_key[-5:]}")
        
        # Test basic HTTP request with correct parameter format
        import aiohttp
        
        url = "https://api.data.gov.in/resource/5713d7e0-8961-4742-a71c-4c5001bac94a"
        params = {
            "api-key": api_key,
            "format": "json",
            "limit": 12,
            "offset": 0,
            "filters[state_name]": "KERALA"  # Correct filter format
        }
        
        print("🌐 Testing data.gov.in API for Kerala soil data...")
        print(f"URL: {url}")
        print(f"Filters: state_name=KERALA")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                print(f"📡 Response Status: {response.status}")
                
                if response.status == 200:
                    data = await response.json()
                    records = data.get("records", [])
                    total = data.get("total", 0)
                    
                    print(f"✅ API Response: Status {response.status}")
                    print(f"📊 Total records: {total}")
                    print(f"📋 Sample records: {len(records)}")
                    
                    if records:
                        print("\n🔬 Sample record structure:")
                        sample_record = records[0]
                        for key, value in sample_record.items():
                            print(f"   - {key}: {value}")
                        
                        print("\n🌾 Relevant soil data fields found:")
                        relevant_fields = [
                            "state_name",
                            "districtname", 
                            "date",
                            "average_soilmoisture_level__at_15cm_",
                            "_average_soilmoisture_volume__at_15cm_",
                            "aggregate_soilmoisture_percentage__at_15cm_",
                            "volume_soilmoisture_percentage__at_15cm_"
                        ]
                        
                        for field in relevant_fields:
                            if field in sample_record:
                                print(f"   ✅ {field}: {sample_record[field]}")
                    
                    print(f"\n🎉 Kerala soil data successfully fetched!")
                    print(f"🌱 Ready for agricultural analysis")
                    
                elif response.status == 403:
                    print("❌ 403 Forbidden - Check API key permissions")
                elif response.status == 502:
                    print("❌ 502 Bad Gateway - Server temporarily unavailable")
                else:
                    error_text = await response.text()
                    print(f"❌ API Error: {response.status}")
                    print(f"Response: {error_text[:200]}...")
                    
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(simple_test())