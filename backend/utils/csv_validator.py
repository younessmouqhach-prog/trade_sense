#!/usr/bin/env python3
"""CSV Data Validator for Trading Platform"""

import csv
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class CSVValidator:
    """Validates OHLC CSV data for trading platforms"""

    def __init__(self, data_dir: str = 'data'):
        self.data_dir = data_dir
        self.required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']

    def validate_csv_file(self, filepath: str) -> Tuple[bool, List[str]]:
        """Validate a single CSV file. Returns (is_valid, errors)"""
        errors = []

        if not os.path.exists(filepath):
            return False, [f"File does not exist: {filepath}"]

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                # Check header
                reader = csv.reader(f)
                header = next(reader, None)

                if not header:
                    return False, ["Empty file or missing header"]

                # Check required columns
                missing_cols = []
                for col in self.required_columns:
                    if col not in header:
                        missing_cols.append(col)

                if missing_cols:
                    return False, [f"Missing required columns: {missing_cols}"]

                # Validate data rows
                row_num = 1  # Start after header
                for row in reader:
                    row_num += 1

                    if len(row) != len(header):
                        errors.append(f"Row {row_num}: Incorrect number of columns ({len(row)} vs {len(header)})")
                        continue

                    # Create row dict
                    row_dict = dict(zip(header, row))

                    # Validate date
                    date_str = row_dict.get('date', '').strip()
                    if not date_str:
                        errors.append(f"Row {row_num}: Missing date")
                        continue

                    try:
                        # Try to parse date
                        if 'T' not in date_str:
                            date_str += 'T00:00:00'
                        datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    except ValueError:
                        errors.append(f"Row {row_num}: Invalid date format '{date_str}'")
                        continue

                    # Validate numeric fields
                    for field in ['open', 'high', 'low', 'close']:
                        try:
                            value = float(row_dict.get(field, '').strip())
                            if value <= 0:
                                errors.append(f"Row {row_num}: {field} must be positive (got {value})")
                        except (ValueError, TypeError):
                            errors.append(f"Row {row_num}: Invalid {field} value '{row_dict.get(field)}'")

                    # Validate volume
                    try:
                        volume = int(float(row_dict.get('volume', '').strip()))
                        if volume < 0:
                            errors.append(f"Row {row_num}: Volume cannot be negative (got {volume})")
                    except (ValueError, TypeError):
                        errors.append(f"Row {row_num}: Invalid volume value '{row_dict.get('volume')}'")

                    # Validate OHLC relationships
                    try:
                        o = float(row_dict['open'])
                        h = float(row_dict['high'])
                        l = float(row_dict['low'])
                        c = float(row_dict['close'])

                        if h < max(o, c):
                            errors.append(f"Row {row_num}: High ({h}) < max(Open,Close) ({max(o,c)})")
                        if l > min(o, c):
                            errors.append(f"Row {row_num}: Low ({l}) > min(Open,Close) ({min(o,c)})")
                    except (ValueError, TypeError):
                        pass  # Skip if numeric validation already failed

        except Exception as e:
            return False, [f"File read error: {str(e)}"]

        max_errors = 10
        if len(errors) > max_errors:
            errors = errors[:max_errors] + [f"... and {len(errors) - max_errors} more errors"]

        return len(errors) == 0, errors

    def validate_all_csvs(self) -> Dict[str, Tuple[bool, List[str]]]:
        """Validate all CSV files in data directory"""
        results = {}

        # Check current data CSVs
        for market in ['stocks', 'forex', 'crypto', 'morocco']:
            filename = f'market_data_{market}.csv'
            filepath = os.path.join(self.data_dir, filename)

            if os.path.exists(filepath):
                is_valid, errors = self.validate_csv_file(filepath)
                results[f'current_{market}'] = (is_valid, errors)

        # Check historical data CSVs
        historical_dir = os.path.join(self.data_dir, 'historical')
        if os.path.exists(historical_dir):
            for filename in os.listdir(historical_dir):
                if filename.endswith('.csv'):
                    filepath = os.path.join(historical_dir, filename)
                    is_valid, errors = self.validate_csv_file(filepath)
                    results[f'historical_{filename}'] = (is_valid, errors)

        return results

    def repair_csv_file(self, filepath: str) -> bool:
        """Attempt to repair common CSV issues"""
        try:
            # Read all lines
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            if not lines:
                return False

            # Parse header
            header = lines[0].strip().split(',')
            if len(header) < len(self.required_columns):
                print(f"Cannot repair {filepath}: insufficient columns in header")
                return False

            # Clean and repair data rows
            repaired_lines = [lines[0]]  # Keep header

            for i, line in enumerate(lines[1:], 1):
                if not line.strip():
                    continue  # Skip empty lines

                parts = line.strip().split(',')
                if len(parts) != len(header):
                    print(f"Skipping line {i}: incorrect column count")
                    continue

                # Basic cleaning
                cleaned_parts = []
                for part in parts:
                    part = part.strip()
                    # Remove quotes if present
                    if part.startswith('"') and part.endswith('"'):
                        part = part[1:-1]
                    # Basic numeric validation
                    if part and part.replace('.', '').replace('-', '').isdigit():
                        try:
                            # Ensure proper formatting
                            if '.' in part:
                                float(part)  # Validate
                                part = f"{float(part):.4f}"
                            else:
                                int(part)  # Validate
                        except:
                            pass
                    cleaned_parts.append(part)

                repaired_lines.append(','.join(cleaned_parts) + '\n')

            # Write back
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.writelines(repaired_lines)

            print(f"Repaired {filepath}")
            return True

        except Exception as e:
            print(f"Failed to repair {filepath}: {e}")
            return False

if __name__ == "__main__":
    validator = CSVValidator()
    results = validator.validate_all_csvs()

    print("CSV Validation Results:")
    print("=" * 50)

    total_files = len(results)
    valid_files = sum(1 for valid, _ in results.values() if valid)
    invalid_files = total_files - valid_files

    print(f"Total files checked: {total_files}")
    print(f"Valid files: {valid_files}")
    print(f"Invalid files: {invalid_files}")
    print()

    for filename, (is_valid, errors) in results.items():
        status = "[VALID]" if is_valid else "[INVALID]"
        print(f"{filename}: {status}")
        if not is_valid:
            for error in errors:
                print(f"  - {error}")
        print()