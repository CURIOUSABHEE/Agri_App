"""Kerala market service for vegetable price data"""

import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from utils.data_processing import parse_price, clean_data_rows
from utils.date_utils import get_date_range, format_date_for_api
from utils.response_utils import create_success_response, create_error_response
import urllib3

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class KeralaMarketService:
    """Service for Kerala vegetable market operations"""
    
    @staticmethod
    async def fetch_veg_price_for_date(date_str: str) -> List[Dict[str, Any]]:
        """Fetch vegetable price data for a specific date from Kerala market API (Async)"""
        api_url = f"https://vegetablemarketprice.com/api/dataapi/market/kerala/daywisedata?date={date_str}"

        headers = {
            "User-Agent": "Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
            "Referer": "https://vegetablemarketprice.com/market/kerala/today",
            "Cookie": "_ga=GA1.1.1072232368.1636388328; _ga_2RYZG7Y4NC=GS2.1.1759342784.5.1.1759342784.44.0.0; _gpi=UID=0000119a1e29e28:T=1759338358:R=1759342784:S=ALNI_MYa1vxkIJVenJ64EpASZM7lLonb1g; __eoid=ID=3e242005d3800aed:T=1759333583:RT=1759342784:S=AA-Afja7rzcLUdDty74fluORbnOj; FCNEC=%5B%22AKsRoLE69Ik9DxBvLee77zjpM1BzUJM1TuiXF1lwVlkgxUcblKupFltUgcsNo3OE26YVQo-rbGpwnQEngenZS-GuasE5ec6CzWWuf1pjNoXJV4fZME4UECN-T7CVvZwFSmgFQi2SBRv_YeAf3ef6GDWZVo-hIg%3D%3D%22%5D%5D"
        }

        try:
            import aiohttp
            import ssl
            
            # Create SSL context that ignores verification (equivalent to verify=False)
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            async with aiohttp.ClientSession(headers=headers, connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
                async with session.get(api_url, timeout=15) as response:
                    if response.status == 200:
                        json_data = await response.json()
                        print(f"DEBUG: Raw API for {date_str} - Keys: {list(json_data.keys())}")
                        if json_data.get("data"):
                            df_data = []
                            raw_data_list = json_data["data"]
                            print(f"DEBUG: Found {len(raw_data_list)} items for {date_str}")
                            
                            # The API now returns data as a list of dictionaries, not arrays
                            for item in raw_data_list:
                                if isinstance(item, dict):
                                    # Extract the required fields and add date
                                    vegetable_name = item.get("vegetablename", "")
                                    
                                    # Skip items that don't have proper vegetable names
                                    if (not vegetable_name or 
                                        vegetable_name.lower() in ['vegetablename', 'price', 'retailprice', 'units'] or
                                        len(vegetable_name.strip()) < 2):
                                        continue
                                    
                                    row_dict = {
                                        "vegetablename": vegetable_name,
                                        "price": item.get("price", ""),
                                        "retailprice": item.get("retailprice", ""),
                                        "shopingmallprice": item.get("shopingmallprice", ""),
                                        "units": item.get("units", ""),
                                        "Date": date_str
                                    }
                                    df_data.append(row_dict)
                                
                            print(f"Processed {len(df_data)} rows of actual vegetable data for {date_str}")
                            return df_data
                        else:
                            print(f"DEBUG: No 'data' key in response for {date_str}")
                    else:
                        print(f"API Error for {date_str}: {response.status} - {await response.text()}")
        except Exception as e:
            print(f"Error fetching vegetable prices for {date_str}: {e}")
        
        return []
    
    @staticmethod
    async def get_market_data(
        start_date: str, 
        end_date: Optional[str] = None, 
        crop_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get Kerala vegetable market data for date range (Async)"""
        try:
            print(f"Kerala Market API called with start_date: {start_date}, end_date: {end_date}, crop_filter: {crop_filter}")
            
            if not end_date:
                end_date = start_date
            
            # Parse dates
            start, end = get_date_range(start_date, end_date)
            
            # Limit to maximum 30 days to prevent long waits
            date_diff = (end - start).days
            if date_diff > 30:
                return create_error_response("Date range too large. Please select a maximum of 30 days.")
            
            import asyncio
            
            # Generate list of dates
            dates_to_fetch = []
            current_date = start
            while current_date <= end:
                dates_to_fetch.append(format_date_for_api(current_date))
                current_date += timedelta(days=1)
            
            print(f"Fetching data for {len(dates_to_fetch)} days concurrently...")
            
            # Fetch all dates concurrently
            tasks = [KeralaMarketService.fetch_veg_price_for_date(date_str) for date_str in dates_to_fetch]
            results = await asyncio.gather(*tasks)
            
            # Combine results
            all_data = []
            for day_data in results:
                all_data.extend(day_data)
            
            if not all_data:
                return create_error_response("No data available for the selected date range")
            
            # Extract unique crops
            crops = set()
            veg_col = None
            
            # Find the vegetable column
            if all_data:
                for key in all_data[0].keys():
                    if key not in ['Date', 'price', 'retailprice']:
                        veg_col = key
                        break
            
            if veg_col:
                for item in all_data:
                    crop = item.get(veg_col)
                    if crop and str(crop).lower() not in ['vegetablename', 'crop', 'name']:
                        crops.add(str(crop))
            
            # Apply crop filter if specified
            filtered_data = all_data
            if crop_filter and crop_filter.strip() and veg_col:
                crop_filter_lower = crop_filter.lower()
                filtered_data = [
                    item for item in all_data 
                    if item.get(veg_col) and crop_filter_lower in str(item.get(veg_col)).lower()
                ]
            
            return create_success_response(
                data=filtered_data,
                crops=sorted(list(crops)),
                vegetable_column=veg_col,
                date_range={"start": start_date, "end": end_date},
                total_records=len(filtered_data),
                crop_filter_applied=crop_filter
            )
        
        except Exception as e:
            print(f"Error in Kerala market data service: {e}")
            return create_error_response(str(e))
    
    @staticmethod
    def generate_farmer_tips(filtered_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate farming tips based on price data analysis"""
        tips = []
        
        if not filtered_data:
            return tips
        
        # Calculate average prices
        wholesale_prices = []
        retail_prices = []
        
        for item in filtered_data:
            wholesale_price = parse_price(item.get('price'))
            retail_price = parse_price(item.get('retailprice'))
            
            if wholesale_price is not None:
                wholesale_prices.append(wholesale_price)
            if retail_price is not None:
                retail_prices.append(retail_price)
        
        if not wholesale_prices and not retail_prices:
            return tips
        
        avg_wholesale = sum(wholesale_prices) / len(wholesale_prices) if wholesale_prices else 0
        avg_retail = sum(retail_prices) / len(retail_prices) if retail_prices else 0
        
        # Tip 1: Retail vs Wholesale margin
        if avg_retail and avg_wholesale:
            margin = avg_retail - avg_wholesale
            if margin > 10:
                tips.append({
                    "icon": "🟢",
                    "message": "Retail prices are much higher than wholesale. Consider direct selling to maximize profit.",
                    "type": "opportunity"
                })
            elif margin > 0:
                tips.append({
                    "icon": "🟡", 
                    "message": "Retail is slightly higher than wholesale. You can still gain by targeting consumers.",
                    "type": "moderate"
                })
            else:
                tips.append({
                    "icon": "🔴",
                    "message": "Wholesale market is more favorable now. Direct selling may not add much benefit.",
                    "type": "caution"
                })
        
        # Tip 2: Price volatility
        if len(retail_prices) > 1:
            mean_retail = sum(retail_prices) / len(retail_prices)
            variance = sum((x - mean_retail) ** 2 for x in retail_prices) / len(retail_prices)
            std_dev = variance ** 0.5
            
            if std_dev > 10:
                tips.append({
                    "icon": "⚠️",
                    "message": "Prices are very volatile. Be cautious and diversify your crop sales.",
                    "type": "warning"
                })
        
        # Tip 3: Best crop recommendation
        if len(filtered_data) > 1:
            veg_col = None
            for key in filtered_data[0].keys():
                if key not in ['Date', 'price', 'retailprice', 'Wholesale_Avg', 'Retail_Avg']:
                    veg_col = key
                    break
            
            if veg_col:
                crop_prices = {}
                for item in filtered_data:
                    crop = item.get(veg_col)
                    retail_price = parse_price(item.get('retailprice'))
                    if crop and retail_price is not None:
                        if crop not in crop_prices:
                            crop_prices[crop] = []
                        crop_prices[crop].append(retail_price)
                
                if crop_prices:
                    crop_averages = {}
                    for crop, prices in crop_prices.items():
                        crop_averages[crop] = sum(prices) / len(prices)
                    
                    best_crop = max(crop_averages, key=crop_averages.get)
                    tips.append({
                        "icon": "🌾",
                        "message": f"'{best_crop}' gave the best retail price on average. Focus more on this crop for profit.",
                        "type": "opportunity"
                    })
        
        return tips
    
    @staticmethod
    def analyze_market_data(
        data: List[Dict[str, Any]], 
        selected_crops: List[str], 
        vegetable_column: str
    ) -> Dict[str, Any]:
        """Analyze filtered Kerala market data and provide farmer tips"""
        try:
            if not data or not selected_crops or not vegetable_column:
                return create_error_response("Missing required data for analysis")
            
            # Filter data for selected crops
            filtered_data = [
                item for item in data 
                if item.get(vegetable_column) in selected_crops
            ]
            
            if not filtered_data:
                return create_error_response("No data found for selected crops")
            
            # Process each item to add average prices
            processed_data = []
            for item in filtered_data:
                processed_item = item.copy()
                
                # Parse and add wholesale average
                wholesale_price = parse_price(item.get('price'))
                if wholesale_price is not None:
                    processed_item['Wholesale_Avg'] = wholesale_price
                
                # Parse and add retail average
                retail_price = parse_price(item.get('retailprice'))
                if retail_price is not None:
                    processed_item['Retail_Avg'] = retail_price
                
                processed_data.append(processed_item)
            
            # Generate farmer tips
            tips = KeralaMarketService.generate_farmer_tips(processed_data)
            
            return create_success_response(
                filtered_data=processed_data,
                tips=tips,
                selected_crops=selected_crops,
                total_records=len(processed_data)
            )
            
        except Exception as e:
            print(f"Error analyzing Kerala market data: {e}")
            return create_error_response(str(e))