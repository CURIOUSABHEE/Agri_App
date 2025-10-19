"""
CSV Soil Data Service
Handles local Kerala soil data from CSV file as fallback for data.gov.in API
"""

import os
import pandas as pd
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class CSVSoilDataService:
    """Service for reading soil data from local CSV file"""
    
    def __init__(self):
        self.csv_file_path = os.path.join(os.path.dirname(__file__), "..", "sm_Kerala_2020.csv")
        self.data_cache = None
        self.last_loaded = None
        
        # Check if CSV file exists
        if not os.path.exists(self.csv_file_path):
            logger.warning(f"Kerala soil CSV file not found at: {self.csv_file_path}")
    
    def _load_csv_data(self) -> pd.DataFrame:
        """Load and cache CSV data"""
        try:
            if self.data_cache is None or self.last_loaded is None:
                logger.info(f"Loading Kerala soil data from CSV: {self.csv_file_path}")
                
                # Read CSV with proper column names
                df = pd.read_csv(self.csv_file_path)
                
                # Standardize column names to match API format
                column_mapping = {
                    'Date': 'date',
                    'State Name': 'state_name',
                    'DistrictName': 'districtname',
                    'Average Soilmoisture Level (at 15cm)': 'average_soilmoisture_level__at_15cm_',
                    'Average SoilMoisture Volume (at 15cm)': '_average_soilmoisture_volume__at_15cm_',
                    'Aggregate Soilmoisture Percentage (at 15cm)': 'aggregate_soilmoisture_percentage__at_15cm_',
                    'Volume Soilmoisture percentage (at 15cm)': 'volume_soilmoisture_percentage__at_15cm_'
                }
                
                df = df.rename(columns=column_mapping)
                
                # Cache the data
                self.data_cache = df
                self.last_loaded = datetime.now()
                
                logger.info(f"Loaded {len(df)} records from Kerala soil CSV")
                
            return self.data_cache
            
        except Exception as e:
            logger.error(f"Error loading CSV data: {e}")
            return pd.DataFrame()
    
    async def get_soil_data_from_csv(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get soil data from local CSV file
        
        Args:
            state: State name to filter by (defaults to Kerala)
            district: District name to filter by
            limit: Number of records to return
            offset: Number of records to skip
            
        Returns:
            Dict containing soil data response
        """
        try:
            df = self._load_csv_data()
            
            if df.empty:
                return {
                    "success": False,
                    "error": "CSV file not found or empty",
                    "data": []
                }
            
            # Apply filters
            filtered_df = df.copy()
            
            # State filter (default to Kerala)
            if state:
                filtered_df = filtered_df[filtered_df['state_name'].str.upper() == state.upper()]
            else:
                filtered_df = filtered_df[filtered_df['state_name'].str.upper() == 'KERALA']
            
            # District filter
            if district:
                filtered_df = filtered_df[
                    filtered_df['districtname'].str.upper() == district.upper()
                ]
            
            # Apply pagination
            total_records = len(filtered_df)
            paginated_df = filtered_df.iloc[offset:offset + limit]
            
            # Convert to records format
            records = paginated_df.to_dict('records')
            
            return {
                "success": True,
                "total_records": total_records,
                "count": len(records),
                "data": records,
                "api_info": {
                    "source": "local_csv",
                    "file_path": self.csv_file_path,
                    "fetched_at": datetime.now().isoformat(),
                    "data_year": "2020",
                    "filters_applied": {
                        "state": state or "KERALA",
                        "district": district
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error reading CSV soil data: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": []
            }
    
    async def get_districts_available(self) -> List[str]:
        """Get list of available districts in the CSV"""
        try:
            df = self._load_csv_data()
            if not df.empty:
                districts = df['districtname'].unique().tolist()
                return sorted(districts)
            return []
        except Exception as e:
            logger.error(f"Error getting districts: {e}")
            return []
    
    async def get_date_range(self) -> Dict[str, str]:
        """Get the date range of data available"""
        try:
            df = self._load_csv_data()
            if not df.empty:
                dates = pd.to_datetime(df['date'])
                return {
                    "start_date": dates.min().strftime("%Y-%m-%d"),
                    "end_date": dates.max().strftime("%Y-%m-%d"),
                    "total_days": len(dates.unique())
                }
            return {}
        except Exception as e:
            logger.error(f"Error getting date range: {e}")
            return {}
    
    async def get_district_summary(self, district: str) -> Dict[str, Any]:
        """Get summary statistics for a specific district"""
        try:
            df = self._load_csv_data()
            if df.empty:
                return {"error": "No data available"}
            
            # Filter by district
            district_data = df[df['districtname'].str.upper() == district.upper()]
            
            if district_data.empty:
                return {"error": f"No data found for district: {district}"}
            
            # Calculate statistics
            numeric_cols = [
                'average_soilmoisture_level__at_15cm_',
                '_average_soilmoisture_volume__at_15cm_',
                'aggregate_soilmoisture_percentage__at_15cm_',
                'volume_soilmoisture_percentage__at_15cm_'
            ]
            
            summary = {
                "district": district.title(),
                "total_records": len(district_data),
                "date_range": {
                    "start": district_data['date'].min(),
                    "end": district_data['date'].max()
                },
                "statistics": {}
            }
            
            for col in numeric_cols:
                if col in district_data.columns:
                    stats = district_data[col].describe()
                    summary["statistics"][col] = {
                        "mean": round(stats['mean'], 2),
                        "median": round(stats['50%'], 2),
                        "min": round(stats['min'], 2),
                        "max": round(stats['max'], 2),
                        "std": round(stats['std'], 2)
                    }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting district summary: {e}")
            return {"error": str(e)}

# Global service instance
csv_soil_data_service = CSVSoilDataService()