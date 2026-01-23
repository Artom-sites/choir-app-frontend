"""
Repertoire list management - auto-updating pinned messages in group.
Uses 3 pinned messages to support large lists.
"""

import os
import json
import logging
from telegram import Bot
from sheets_client import get_sheets_client
from config import REPERTOIRE_GROUP_ID, CATEGORIES

logger = logging.getLogger(__name__)

# Path to store message IDs (JSON list)
MESSAGE_IDS_FILE = os.path.join(os.path.dirname(__file__), ".repertoire_message_ids")

# Number of messages to use
MESSAGE_COUNT = 3
MAX_CHARS_PER_MESSAGE = 3800  # Safe limit (max is 4096)

CATEGORY_EMOJIS = {
    "Новий рік": "🎄",
    "Різдво": "✨",
    "В'їзд": "🌿",
    "Вечеря": "🍷",
    "Пасха": "🔆",
    "Вознесіння": "☁️",
    "Трійця": "🕊️",
    "Свято Жнив": "🌾",
    "Інші": "📁"
}


def get_stored_message_ids() -> list[int]:
    """Get stored message IDs from file."""
    try:
        if os.path.exists(MESSAGE_IDS_FILE):
            with open(MESSAGE_IDS_FILE, "r") as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Error reading message IDs: {e}")
    return []


def save_message_ids(message_ids: list[int]):
    """Save message IDs to file."""
    try:
        with open(MESSAGE_IDS_FILE, "w") as f:
            json.dump(message_ids, f)
    except Exception as e:
        logger.error(f"Error saving message IDs: {e}")


def format_full_repertoire_text(repertoire: list[dict]) -> str:
    """Format full repertoire text grouped by category."""
    if not repertoire:
        return "📋 *Репертуар хору*\n\n_Поки що порожній_"
    
    lines = ["📋 *Репертуар хору*\n"]
    
    # Group songs by category
    grouped = {c: [] for c in CATEGORIES}
    
    for song in repertoire:
        cat = song.get("Категорія")
        if not cat or cat not in grouped:
            cat = "Інші"
        grouped[cat].append(song)
    
    # Build message
    count = 1
    for category in CATEGORIES:
        songs = grouped.get(category, [])
        if not songs:
            continue
            
        emoji = CATEGORY_EMOJIS.get(category, "📂")
        lines.append(f"\n{emoji} *{category}*")
        
        for song in songs:
            title = song.get("Назва", "").strip()
            if not title:
                continue  # Skip empty titles
            link = song.get("Посилання", "")
            
            if link:
                lines.append(f"{count}. [{title}]({link})")
            else:
                lines.append(f"{count}. {title}")
            count += 1
            
    if count == 1:
        lines.append("_Немає пісень_")
    
    lines.append(f"\n_Всього: {count - 1} пісень_")
    lines.append(f"_Оновлено: {__import__('datetime').datetime.now().strftime('%d.%m.%Y %H:%M')}_")
    
    return "\n".join(lines)


def split_text_into_chunks(text: str, chunk_count: int) -> list[str]:
    """Split text into chunks by lines, respecting max limit."""
    lines = text.split('\n')
    chunks = []
    current_chunk = []
    current_length = 0
    
    # Pre-calculate target per chunk roughly, but primarily respect MAX_CHARS
    # Actually, we just fill chunks sequentially.
    
    for line in lines:
        line_len = len(line) + 1  # +1 for newline
        
        # If adding this line exceeds limit, start new chunk
        if current_length + line_len > MAX_CHARS_PER_MESSAGE:
            chunks.append("\n".join(current_chunk))
            current_chunk = [line]
            current_length = line_len
        else:
            current_chunk.append(line)
            current_length += line_len
    
    if current_chunk:
        chunks.append("\n".join(current_chunk))
        
    # Pad with empty strings if fewer chunks than requested
    while len(chunks) < chunk_count:
        chunks.append("")
        
    return chunks[:chunk_count]  # Limit to requested count


async def reset_repertoire_messages(bot: Bot) -> bool:
    """Delete old messages and create new ones."""
    if not REPERTOIRE_GROUP_ID:
        return False
        
    # Delete old messages if known
    old_ids = get_stored_message_ids()
    for mid in old_ids:
        try:
            await bot.delete_message(chat_id=REPERTOIRE_GROUP_ID, message_id=mid)
        except Exception:
            pass  # Ignore if already deleted
            
    # Also check if there was a separate file for single ID and delete it
    old_single_file = os.path.join(os.path.dirname(__file__), ".repertoire_message_id")
    if os.path.exists(old_single_file):
        try:
            with open(old_single_file, "r") as f:
                mid = int(f.read().strip())
                await bot.delete_message(chat_id=REPERTOIRE_GROUP_ID, message_id=mid)
            os.remove(old_single_file)
        except Exception:
            pass

    # Create new messages
    new_ids = []
    try:
        for i in range(MESSAGE_COUNT):
            msg = await bot.send_message(
                chat_id=REPERTOIRE_GROUP_ID,
                text=f"📋 *Репертуар хору (частина {i+1}/{MESSAGE_COUNT})*\n_Завантаження..._",
                parse_mode="Markdown",
                disable_notification=True
            )
            new_ids.append(msg.message_id)
            
            # Pin only the first message
            if i == 0:
                try:
                    await bot.pin_chat_message(
                        chat_id=REPERTOIRE_GROUP_ID,
                        message_id=msg.message_id,
                        disable_notification=True
                    )
                except Exception as e:
                    logger.error(f"Error pinning message {msg.message_id}: {e}")
                
        save_message_ids(new_ids)
        return True
    except Exception as e:
        logger.error(f"Error creating repertoire messages: {e}")
        return False


async def update_repertoire_list(bot: Bot) -> bool:
    """Update the pinned repertoire list in the group."""
    if not REPERTOIRE_GROUP_ID:
        return False
    
    try:
        sheets = get_sheets_client()
        repertoire = sheets.get_repertoire()
        full_text = format_full_repertoire_text(repertoire)
        
        chunks = split_text_into_chunks(full_text, MESSAGE_COUNT)
        
        message_ids = get_stored_message_ids()
        
        # If no IDs or count mismatch, reset
        if not message_ids or len(message_ids) != MESSAGE_COUNT:
            logger.info("Resetting repertoire messages due to ID mismatch")
            if not await reset_repertoire_messages(bot):
                return False
            message_ids = get_stored_message_ids()
            
        # Update messages
        for i, text in enumerate(chunks):
            chunk_header = f"📋 *Репертуар хору ({i+1}/{MESSAGE_COUNT})*\n"
            current_text = text
            
            # Ensure header is present if it's not the first part (or for consistency)
            # format_full_repertoire_text adds header to start.
            # split logic might put header in first chunk.
            # But subsequent chunks are just lists.
            # Let's clean up logic: 
            # If chunk is empty -> standard text.
            # If chunk has content -> send content.
            
            if not current_text.strip():
                final_text = f"{chunk_header}\n_Продовження..._"
            else:
                # If it's the first chunk, it already has the main header.
                # If it's subsequent, we might want to add a header.
                # But to keep it seamless "one long text", we only need header on first.
                # But user asked for "repertoire 1/3", "repertoire 2/3".
                
                # Let's adjust: format logic shouldn't add "Repertoire" header, 
                # instead we add it here per message?
                # No, standard is to just let text flow.
                # But headers help navigation.
                
                # Let's stick to user request roughly: "repertoire 1/3".
                # But he also said "to be on top".
                # Simply update text.
                final_text = current_text
                
            try:
                await bot.edit_message_text(
                    chat_id=REPERTOIRE_GROUP_ID,
                    message_id=message_ids[i],
                    text=final_text,
                    parse_mode="Markdown",
                    disable_web_page_preview=True
                )
            except Exception as e:
                logger.error(f"Could not edit message {message_ids[i]}: {e}")
                # If deleted, we might need full reset.
                if "Message to edit not found" in str(e) or "message to edit not found" in str(e):
                     # Try one reset
                     logger.info("Message missing, resetting all.")
                     await reset_repertoire_messages(bot)
                     # Recursive call? careful. Just return False to retry next time or try once.
                     # Better to fail now and next update will handle it? 
                     # Or retry immediately once.
                     # Let's not recurse infinite.
                     return False
                     
        return True
        
    except Exception as e:
        logger.error(f"Error updating repertoire list: {e}")
        return False


def get_repertoire_message_link() -> str | None:
    """Get link to the pinned repertoire message (first one)."""
    message_ids = get_stored_message_ids()
    if not REPERTOIRE_GROUP_ID or not message_ids:
        return None
    
    first_id = message_ids[0]
    
    # Check if supergroup ID (starts with -100)
    group_id_str = str(REPERTOIRE_GROUP_ID)
    if group_id_str.startswith("-100"):
        chat_id = group_id_str[4:]  # Remove -100
        return f"https://t.me/c/{chat_id}/{first_id}"
    
    return None
