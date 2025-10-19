#!/usr/bin/env python3
"""
Test exact URL format provided by user
"""
import asyncio
import aiohttp

async def test_exact_url():
    try:
        # Test the exact URL format provided by user
        url = "https://api.data.gov.in/resource/5713d7e0-8961-4742-a71c-4c5001bac94a"
        params = {
            "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b",
            "format": "json",
            "offset": "12",
            "limit": "12",
            "filters[state_name]": "KERALA"
        }
        
        print("🔗 Testing exact URL format from documentation...")
        print(f"URL: {url}")
        
        # Show the constructed URL
        param_string = "&".join([f"{k}={v}" for k, v in params.items()])
        full_url = f"{url}?{param_string}"
        print(f"Full URL: {full_url}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                print(f"\n📡 Response Status: {response.status}")
                print(f"Response Headers: {dict(response.headers)}")
                
                if response.status == 200:
                    data = await response.json()
                    print("✅ SUCCESS! API is working")
                    print(f"Response keys: {list(data.keys())}")
                    
                    records = data.get("records", [])
                    print(f"Records found: {len(records)}")
                    
                    if records:
                        print("\nFirst record sample:")
                        first_record = records[0]
                        for key, value in list(first_record.items())[:5]:
                            print(f"  {key}: {value}")
                    
                else:
                    error_text = await response.text()
                    print(f"❌ Error: {response.status}")
                    print(f"Error response: {error_text[:500]}")
                    
                    # Additional debugging
                    if response.status == 502:
                        print("\n🔍 Debugging 502 error:")
                        print("- This could be a temporary server issue")
                        print("- The API endpoint might be overloaded")
                        print("- Try again in a few minutes")
                    elif response.status == 403:
                        print("\n🔍 Debugging 403 error:")
                        print("- API key might be invalid or expired")
                        print("- Check if you need to generate a new API key")
                    elif response.status == 400:
                        print("\n🔍 Debugging 400 error:")
                        print("- Parameter format might be incorrect")
                        print("- Check filter syntax")
                    
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_exact_url())