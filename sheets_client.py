"""
Google Sheets client for managing repertoire data and regents.
"""

import uuid
import secrets
from datetime import datetime
from typing import Optional

import gspread
from google.oauth2.service_account import Credentials

from config import GOOGLE_SHEET_ID, GOOGLE_CREDENTIALS_FILE, SHEET_REPERTOIRE, SHEET_DATABASE, SHEET_REGENTS


# Google Sheets API scopes
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]


class SheetsClient:
    """Client for interacting with Google Sheets."""
    
    def __init__(self):
        """Initialize the Google Sheets client."""
        self._client = None
        self._spreadsheet = None
        self._repertoire_sheet = None
        self._database_sheet = None
        self._regents_sheet = None
    
    def connect(self):
        """Establish connection to Google Sheets."""
        credentials = Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=SCOPES
        )
        self._client = gspread.authorize(credentials)
        self._spreadsheet = self._client.open_by_key(GOOGLE_SHEET_ID)
        
        # Get or create worksheets
        self._repertoire_sheet = self._get_or_create_sheet(SHEET_REPERTOIRE)
        self._database_sheet = self._get_or_create_sheet(SHEET_DATABASE)
        self._regents_sheet = self._get_or_create_sheet(SHEET_REGENTS)
        
        # Ensure headers exist
        self._ensure_headers()
    
    def _get_or_create_sheet(self, sheet_name: str):
        """Get existing sheet or create new one."""
        try:
            return self._spreadsheet.worksheet(sheet_name)
        except gspread.exceptions.WorksheetNotFound:
            return self._spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=20)
    
    def _ensure_headers(self):
        """Ensure headers are set in all sheets."""
        # Repertoire headers
        repertoire_headers = ["Назва", "Додано", "Регент", "Посилання", "Категорія"]
        existing = self._repertoire_sheet.row_values(1)
        if not existing or existing[:5] != repertoire_headers:
            self._repertoire_sheet.update("A1:E1", [repertoire_headers])
        
        # Database headers
        database_headers = [
            "ID", "Назва", "Назва нормалізована", "Telegram ID",
            "Username", "Статус", "Дата", "File ID", "Message ID",
            "Назва авто", "Назва ручна", "Посилання", "Категорія"
        ]
        existing = self._database_sheet.row_values(1)
        if not existing or existing[:13] != database_headers:
            self._database_sheet.update("A1:M1", [database_headers])

        # Regents headers
        regents_headers = ["ID", "Name", "Invite Code", "Telegram ID", "Username", "Status", "Created At"]
        existing = self._regents_sheet.row_values(1)
        if not existing or existing[:7] != regents_headers:
            self._regents_sheet.update("A1:G1", [regents_headers])
    
    def check_duplicate(self, normalized_title: str) -> tuple[bool, Optional[str], Optional[str], Optional[str], bool]:
        """Check if a song with this title already exists in Repertoire or Database."""
        from difflib import SequenceMatcher
        
        # Threshold for similarity (0.8 = 80% similar)
        SIMILARITY_THRESHOLD = 0.75
        normalized_lower = normalized_title.lower().strip()
        
        try:
            # First check in Repertoire (active songs)
            rep_titles = self._repertoire_sheet.col_values(1)[1:]  # Назва
            rep_regents = self._repertoire_sheet.col_values(3)[1:]  # Регент
            rep_links = self._repertoire_sheet.col_values(4)[1:]  # Посилання
            
            for i, title in enumerate(rep_titles):
                if not title:
                    continue
                title_lower = title.lower().strip()
                regent = rep_regents[i] if i < len(rep_regents) else "Невідомо"
                link = rep_links[i] if i < len(rep_links) else None
                
                # Exact match
                if title_lower == normalized_lower:
                    return True, regent, title, link, True
                
                # Fuzzy match
                similarity = SequenceMatcher(None, normalized_lower, title_lower).ratio()
                if similarity >= SIMILARITY_THRESHOLD:
                    return True, regent, title, link, False
            
            # Then check in Database (approved songs)
            existing_titles = self._database_sheet.col_values(3)[1:]  # Normalized title
            existing_original_titles = self._database_sheet.col_values(2)[1:]  # Original title
            existing_usernames = self._database_sheet.col_values(5)[1:]  # Username column
            existing_statuses = self._database_sheet.col_values(6)[1:]  # Status column
            existing_links = self._database_sheet.col_values(12)[1:]  # Link column
            
            for i, title in enumerate(existing_titles):
                # Only check approved songs
                if i >= len(existing_statuses) or existing_statuses[i] != "approved":
                    continue
                
                title_lower = title.lower().strip()
                regent = existing_usernames[i] if i < len(existing_usernames) else "Невідомо"
                original = existing_original_titles[i] if i < len(existing_original_titles) else title
                link = existing_links[i] if i < len(existing_links) else None
                
                # Exact match
                if title_lower == normalized_lower:
                    return True, regent, original, link, True
                
                # Fuzzy match
                similarity = SequenceMatcher(None, normalized_lower, title_lower).ratio()
                if similarity >= SIMILARITY_THRESHOLD:
                    return True, regent, original, link, False
            
            return False, None, None, None, False
        except Exception as e:
            print(f"Error checking duplicate: {e}")
            return False, None, None, None, False
    
    def create_request(
        self,
        title: str,
        normalized_title: str,
        telegram_id: int,
        username: str,
        file_id: str,
        auto_title: Optional[str] = None,
        file_link: Optional[str] = None,
        category: str = "Інші"
    ) -> str:
        """Create a new song request."""
        request_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        row = [
            request_id,
            title,
            normalized_title,
            str(telegram_id),
            username,
            "pending",
            timestamp,
            file_id,
            "",  # Message ID
            auto_title or "",
            title if auto_title != title else "",
            file_link or "",
            category
        ]
        
        self._database_sheet.append_row(row)
        return request_id
    
    def update_message_id(self, request_id: str, message_id: int):
        """Update the admin message ID for a request."""
        cell = self._database_sheet.find(request_id, in_column=1)
        if cell:
            self._database_sheet.update_cell(cell.row, 9, str(message_id))
    
    def update_status(self, request_id: str, status: str) -> bool:
        """Update request status."""
        try:
            cell = self._database_sheet.find(request_id, in_column=1)
            if cell:
                self._database_sheet.update_cell(cell.row, 6, status)
                return True
            return False
        except Exception as e:
            print(f"Error updating status: {e}")
            return False
    
    def get_request(self, request_id: str) -> Optional[dict]:
        """Get a request by ID."""
        try:
            cell = self._database_sheet.find(request_id, in_column=1)
            if cell:
                row = self._database_sheet.row_values(cell.row)
                headers = self._database_sheet.row_values(1)
                
                # Pad row if necessary
                while len(row) < len(headers):
                    row.append("")
                
                return dict(zip(headers, row))
            return None
        except Exception as e:
            print(f"Error getting request: {e}")
            return None
    
    def add_to_repertoire(self, title: str, regent_name: str, file_link: str = "", category: str = "Інші") -> bool:
        """Add song to repertoire."""
        try:
            date_added = datetime.now().strftime("%Y-%m-%d")
            row = [title, date_added, regent_name, file_link, category]
            self._repertoire_sheet.append_row(row)
            return True
        except Exception as e:
            print(f"Error adding to repertoire: {e}")
            return False
    
    def get_repertoire(self) -> list[dict]:
        """Get all songs in repertoire."""
        try:
            all_records = self._repertoire_sheet.get_all_records()
            return all_records
        except Exception as e:
            print(f"Error getting repertoire: {e}")
            return []

    # --- Regent Management ---

    def create_invite_code(self) -> str:
        """Create a new invite code and add to sheet."""
        code = secrets.token_hex(4)  # 8 chars
        regent_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # ID, Name, Invite Code, Telegram ID, Username, Status, Created At
        row = [regent_id, "", code, "", "", "pending", timestamp]
        
        self._regents_sheet.append_row(row)
        return code

    def get_regent_by_code(self, code: str) -> Optional[dict]:
        """Find pending regent invite by code."""
        try:
            cell = self._regents_sheet.find(code, in_column=3)
            if cell:
                row = self._regents_sheet.row_values(cell.row)
                headers = self._regents_sheet.row_values(1)
                data = dict(zip(headers, row))
                
                if data.get("Status") == "pending":
                    data["_row"] = cell.row  # Internal use
                    return data
            return None
        except Exception as e:
            print(f"Error looking up invite code: {e}")
            return None

    def register_regent(self, code: str, telegram_id: int, username: str, full_name: str) -> bool:
        """Register a regent using an invite code."""
        regent = self.get_regent_by_code(code)
        if not regent:
            return False
            
        row_idx = regent["_row"]
        
        # Update Name, Telegram ID, Username, Status
        # Columns: 2=Name, 4=Telegram ID, 5=Username, 6=Status
        self._regents_sheet.update_cell(row_idx, 2, full_name)
        self._regents_sheet.update_cell(row_idx, 4, str(telegram_id))
        self._regents_sheet.update_cell(row_idx, 5, username or "")
        self._regents_sheet.update_cell(row_idx, 6, "active")
        return True

    def get_all_regents(self) -> list[dict]:
        """Get all active regents."""
        try:
            all_records = self._regents_sheet.get_all_records()
            return [r for r in all_records if r.get("Status") == "active"]
        except Exception as e:
            print(f"Error getting regents: {e}")
            return []
            
    def is_regent(self, telegram_id: int) -> bool:
        """Check if user is an authorized regent."""
        try:
            cell = self._regents_sheet.find(str(telegram_id), in_column=4)
            if cell:
                status = self._regents_sheet.cell(cell.row, 6).value
                return status == "active"
            return False
        except Exception as e:
            print(f"Error checking regent status: {e}")
            return False


# Singleton instance
_sheets_client = None


def get_sheets_client() -> SheetsClient:
    """Get or create the sheets client singleton."""
    global _sheets_client
    if _sheets_client is None:
        _sheets_client = SheetsClient()
        _sheets_client.connect()
    return _sheets_client
