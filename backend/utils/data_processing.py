"""Data processing utilities"""

def parse_price(price_str):
    """Parse price string to handle ranges like ₹45-50"""
    try:
        price_str = str(price_str)
        if not price_str or price_str.lower() in ["none", "null", ""]:
            return None
        
        # Remove currency symbol and clean
        clean_str = price_str.replace('₹', '').strip()
        
        if '-' in clean_str:
            # Handle price ranges
            parts = clean_str.split('-')
            numbers = []
            for part in parts:
                try:
                    num = float(part.strip())
                    numbers.append(num)
                except ValueError:
                    continue
            
            if numbers:
                return sum(numbers) / len(numbers)  # Average of range
        else:
            # Single price
            return float(clean_str)
    except (ValueError, TypeError):
        return None
    
    return None

def filter_valid_crops(crops):
    """Filter out invalid or header-like crop names"""
    if not crops:
        return []
    
    valid_crops = []
    for crop in crops:
        if (crop and 
            isinstance(crop, str) and
            crop.lower() not in ['vegetablename', 'crop', 'name', 'vegetable'] and
            crop.strip() != ''):
            valid_crops.append(crop)
    
    return valid_crops

def clean_data_rows(data_rows, headers_list):
    """Remove header rows from data if present"""
    if not data_rows or not headers_list:
        return []
    
    clean_rows = []
    
    for row in data_rows:
        if not row:
            continue
            
        # Check if this row contains header-like values
        is_header_row = False
        
        # Check if any cell in the row matches header names
        for cell in row:
            cell_str = str(cell).lower().strip()
            
            # Skip rows that contain header field names or placeholder values
            if (cell_str in ['vegetablename', 'price', 'retailprice', 'shopingmallprice', 
                           'units', 'imageproperties', 'crop', 'name', 'vegetable',
                           'wholesale', 'retail', 'mall', 'unit'] or
                cell_str == '' or
                cell_str == 'none' or
                cell_str.startswith('header') or
                cell_str in [h.lower() for h in headers_list]):
                is_header_row = True
                break
        
        # Only include rows that have actual vegetable data
        if not is_header_row:
            # Additional check: ensure the vegetable name looks like a real vegetable
            if len(row) > 0:
                vegetable_name = str(row[0]).strip()
                if (len(vegetable_name) > 2 and 
                    vegetable_name.lower() not in ['vegetablename', 'price', 'retailprice', 'units'] and
                    not vegetable_name.lower().startswith('image')):
                    clean_rows.append(row)
    
    print(f"Filtered {len(data_rows)} raw rows to {len(clean_rows)} clean rows")
    return clean_rows