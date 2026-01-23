"""
Google Drive client for uploading files.
"""

import io
from typing import Optional

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2.service_account import Credentials

from config import GOOGLE_CREDENTIALS_FILE, GOOGLE_DRIVE_FOLDER_ID

# Google API scopes
SCOPES = [
    "https://www.googleapis.com/auth/drive.file"
]


class DriveClient:
    """Client for uploading files to Google Drive (using shared folder)."""
    
    def __init__(self):
        """Initialize the Drive client."""
        self._service = None
        self._folder_id = None
    
    def connect(self):
        """Establish connection to Google Drive."""
        if not GOOGLE_DRIVE_FOLDER_ID:
            print("Warning: GOOGLE_DRIVE_FOLDER_ID not set. File uploads disabled.")
            return
        
        credentials = Credentials.from_service_account_file(
            GOOGLE_CREDENTIALS_FILE,
            scopes=SCOPES
        )
        self._service = build('drive', 'v3', credentials=credentials)
        self._folder_id = GOOGLE_DRIVE_FOLDER_ID
    
    def upload_file(self, file_bytes: bytes, filename: str, title: str) -> Optional[str]:
        """
        Upload a file to Google Drive.
        
        Args:
            file_bytes: File content as bytes
            filename: Original filename (for extension)
            title: Song title (for naming the file)
            
        Returns:
            URL to the file or None on error
        """
        if not self._folder_id or not self._service:
            return None
        
        try:
            # Determine mime type
            if filename.lower().endswith('.pdf'):
                mime_type = 'application/pdf'
                ext = '.pdf'
            elif filename.lower().endswith('.docx'):
                mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ext = '.docx'
            else:
                mime_type = 'application/octet-stream'
                ext = ''
            
            # Clean title for filename
            safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_', 'а', 'б', 'в', 'г', 'д', 'е', 'є', 'ж', 'з', 'и', 'і', 'ї', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ь', 'ю', 'я', 'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Є', 'Ж', 'З', 'И', 'І', 'Ї', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ь', 'Ю', 'Я')).strip()
            safe_title = safe_title[:100]  # Limit length
            
            file_metadata = {
                'name': f"{safe_title}{ext}",
                'parents': [self._folder_id]
            }
            
            media = MediaIoBaseUpload(
                io.BytesIO(file_bytes),
                mimetype=mime_type,
                resumable=True
            )
            
            # Use supportsAllDrives to work with shared folders
            file = self._service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink',
                supportsAllDrives=True
            ).execute()
            
            # Make file accessible by anyone with link
            self._service.permissions().create(
                fileId=file['id'],
                body={'type': 'anyone', 'role': 'reader'},
                supportsAllDrives=True
            ).execute()
            
            return file.get('webViewLink')
            
        except Exception as e:
            print(f"Error uploading file to Drive: {e}")
            return None


# Singleton instance
_drive_client = None


def get_drive_client() -> DriveClient:
    """Get or create the drive client singleton."""
    global _drive_client
    if _drive_client is None:
        _drive_client = DriveClient()
        _drive_client.connect()
    return _drive_client
