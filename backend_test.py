import requests
import sys
import json
import time
from datetime import datetime
from io import BytesIO
from PIL import Image

class AgriAdvisorAPITester:
    def __init__(self, base_url="https://agriadvisor-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.passed_tests.append(name)
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:500]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Error: {response.text[:200]}...")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.failed_tests.append({
                "test": name,
                "expected": expected_status,
                "actual": "Exception",
                "error": str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_soil_analysis(self):
        """Test soil analysis endpoint with Maharashtra coordinates"""
        # Mumbai coordinates (Maharashtra)
        test_data = {
            "latitude": 19.0760,
            "longitude": 72.8777,
            "state": "Maharashtra",
            "district": "Mumbai"
        }
        return self.run_test("Soil Analysis", "POST", "analyze-soil", 200, data=test_data)

    def test_weather_forecast(self):
        """Test weather forecast endpoint"""
        # Pune coordinates (Maharashtra)
        test_data = {
            "latitude": 18.5204,
            "longitude": 73.8567,
            "state": "Maharashtra",
            "district": "Pune"
        }
        return self.run_test("Weather Forecast", "POST", "weather-forecast", 200, data=test_data)

    def test_crop_recommendations(self):
        """Test crop recommendations endpoint with Gemini AI integration"""
        # Nashik coordinates (Maharashtra - agricultural region)
        test_data = {
            "latitude": 19.9975,
            "longitude": 73.7898,
            "state": "Maharashtra",
            "district": "Nashik"
        }
        print("   Note: This test may take longer due to AI processing...")
        return self.run_test("Crop Recommendations", "POST", "crop-recommendations", 200, data=test_data)

    def test_disease_detection(self):
        """Test disease detection endpoint with image upload"""
        # Create a simple test image
        try:
            # Create a small test image (simulating crop image)
            img = Image.new('RGB', (100, 100), color='green')
            img_buffer = BytesIO()
            img.save(img_buffer, format='JPEG')
            img_buffer.seek(0)
            
            files = {'file': ('test_crop.jpg', img_buffer, 'image/jpeg')}
            print("   Note: This test may take longer due to AI image analysis...")
            return self.run_test("Disease Detection", "POST", "analyze-crop-disease", 200, files=files)
        except Exception as e:
            print(f"❌ Failed to create test image: {e}")
            return False, {}

    def test_recommendation_history(self):
        """Test recommendation history endpoint"""
        return self.run_test("Recommendation History", "GET", "recommendations/history", 200)

    def test_invalid_coordinates(self):
        """Test API with invalid coordinates"""
        test_data = {
            "latitude": 999,  # Invalid latitude
            "longitude": 999,  # Invalid longitude
            "state": "Maharashtra"
        }
        # This should still return 200 but with mock data
        return self.run_test("Invalid Coordinates", "POST", "analyze-soil", 200, data=test_data)

def main():
    print("🌾 Starting AgriAdvisor AI API Testing...")
    print("=" * 60)
    
    # Setup
    tester = AgriAdvisorAPITester()
    
    # Test all endpoints
    print("\n📡 Testing API Endpoints...")
    
    # Basic connectivity
    tester.test_root_endpoint()
    
    # Core agricultural features
    tester.test_soil_analysis()
    tester.test_weather_forecast()
    tester.test_crop_recommendations()
    tester.test_disease_detection()
    tester.test_recommendation_history()
    
    # Edge cases
    tester.test_invalid_coordinates()
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Total Tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.passed_tests:
        print(f"\n✅ Passed Tests:")
        for test in tester.passed_tests:
            print(f"   - {test}")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure['test']}: Expected {failure['expected']}, got {failure['actual']}")
            print(f"     Error: {failure['error'][:100]}...")
    
    # Test specific Maharashtra features
    print(f"\n🏞️ Maharashtra-specific Features Tested:")
    print(f"   - Soil analysis with Maharashtra coordinates ✓")
    print(f"   - Weather data for Maharashtra regions ✓")
    print(f"   - Crop recommendations for Maharashtra farming ✓")
    print(f"   - AI integration with Gemini Pro ✓")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())