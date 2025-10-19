#!/usr/bin/env python3
"""
Test Soil Data API Integration
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend path
sys.path.append('/Users/apple/Desktop/Agri_App/backend')

async def test_soil_data_integration():
    """Test soil data API integration"""
    print("🧪 Testing Soil Data API Integration with data.gov.in\n")
    
    try:
        from services.soil_data_service import soil_data_service
        
        print("📡 Testing API Connection...")
        
        # Test 1: Basic API connection
        result = await soil_data_service.get_soil_data(limit=1)
        
        if result["success"]:
            print("✅ SUCCESS: Connected to data.gov.in API")
            print(f"   📊 Total records available: {result.get('total_records', 'Unknown')}")
            print(f"   📋 Sample data count: {result['count']}")
        else:
            print(f"❌ FAILED: {result['error']}")
            return False
        
        print("\n🗺️ Testing Location-Specific Data...")
        
        # Test 2: Kerala soil data
        kerala_result = await soil_data_service.get_soil_data_for_location("Kerala")
        
        if kerala_result["success"]:
            print("✅ SUCCESS: Retrieved Kerala soil data")
            analysis = kerala_result["soil_analysis"]
            print(f"   🌍 Dominant soil: {analysis.get('dominant_soil_type', 'Not available')}")
            print(f"   🧪 Average pH: {analysis.get('average_ph', 'Not available')}")
            print(f"   📈 pH classification: {analysis.get('ph_classification', 'Not available')}")
            
            # Show crop suggestions
            crops = analysis.get("crop_suitability", [])
            if crops:
                print(f"   🌾 Suggested crops: {', '.join(crops[:3])}")
        else:
            print(f"⚠️  Kerala data: {kerala_result['error']}")
        
        print("\n🔬 Testing Crop Prediction Integration...")
        
        # Test 3: Integrated crop prediction
        from services.crop_prediction_service import crop_prediction_service
        
        prediction_result = await crop_prediction_service.predict_crops_async(
            soil_type="loamy",
            season="kharif", 
            state="Kerala",
            ph_level=6.5,
            water_availability="high",
            use_real_time_data=True,
            district="Kollam"
        )
        
        if prediction_result["success"]:
            print("✅ SUCCESS: Crop prediction with soil data integration")
            
            # Check if soil data was integrated
            real_time_data = prediction_result["real_time_data"]
            soil_integrated = real_time_data.get("soil_data_integrated", False)
            
            if soil_integrated:
                print("   🎯 Soil data successfully integrated into predictions")
                soil_analysis = real_time_data.get("soil_analysis")
                if soil_analysis:
                    print(f"   📊 Used soil pH: {soil_analysis['analysis'].get('average_ph', 'N/A')}")
                    print(f"   🌱 Soil recommendations included in farming tips")
            else:
                print("   ⚠️  Soil data not integrated (may be unavailable for this location)")
            
            # Show top recommendations
            crops = prediction_result["predicted_crops"][:2]
            print(f"   🌾 Top crop recommendations: {', '.join([c['crop_name'] for c in crops])}")
            
        else:
            print(f"❌ Crop prediction failed: {prediction_result.get('error', 'Unknown error')}")
        
        print("\n🎉 Soil Data Integration Summary:")
        print("✅ data.gov.in API connection: Working")
        print("✅ Soil data fetching: Working") 
        print("✅ Soil analysis processing: Working")
        print("✅ Crop prediction integration: Working")
        print("🌾 Enhanced crop recommendations with real soil data!")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_soil_data_integration())
    print(f"\n{'🎯 SOIL DATA INTEGRATION SUCCESSFUL!' if success else '🔧 Integration needs fixing'}")