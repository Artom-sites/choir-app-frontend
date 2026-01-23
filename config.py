"""
Configuration module for the Telegram bot.
Loads settings from environment variables.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


# Telegram Bot Settings
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
CHIEF_REGENT_ID = int(os.getenv("CHIEF_REGENT_ID", "0"))
ADMIN_IDS = [CHIEF_REGENT_ID]

# Google Sheets Settings
GOOGLE_SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
GOOGLE_CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")  # Optional - for file uploads

# Telegram Storage Channel (for permanent file links)
STORAGE_CHANNEL_ID = os.getenv("STORAGE_CHANNEL_ID", "")  # Channel ID or @username

# Repertoire list in group (auto-updating pinned message)
REPERTOIRE_GROUP_ID = os.getenv("REPERTOIRE_GROUP_ID", "")  # Group/channel for list
REPERTOIRE_MESSAGE_ID = os.getenv("REPERTOIRE_MESSAGE_ID", "")  # Message ID to edit

# Sheet names
SHEET_REPERTOIRE = "Репертуар"
SHEET_DATABASE = "База"
SHEET_REGENTS = "Регенти"

# Categories
CATEGORIES = [
    "Новий рік", "Різдво", "В'їзд",
    "Вечеря", "Пасха", "Вознесіння",
    "Трійця", "Свято Жнив", "Інші"
]


def validate_config():
    """Validate that all required configuration is present."""
    errors = []
    
    if not TELEGRAM_TOKEN:
        errors.append("TELEGRAM_TOKEN is not set")
    
    if not CHIEF_REGENT_ID:
        errors.append("CHIEF_REGENT_ID is not set")
    
    if not GOOGLE_SHEET_ID:
        errors.append("GOOGLE_SHEET_ID is not set")
    
    if not os.path.exists(GOOGLE_CREDENTIALS_FILE):
        errors.append(f"Google credentials file not found: {GOOGLE_CREDENTIALS_FILE}")
    
    if errors:
        raise ValueError("Configuration errors:\n" + "\n".join(f"  - {e}" for e in errors))


if __name__ == "__main__":
    try:
        validate_config()
        print("✅ Configuration is valid")
    except ValueError as e:
        print(f"❌ {e}")
