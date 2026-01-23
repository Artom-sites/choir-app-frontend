"""
Admin handlers for managing song requests.
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler

from config import CHIEF_REGENT_ID, STORAGE_CHANNEL_ID, ADMIN_IDS
from sheets_client import get_sheets_client
from repertoire_list import update_repertoire_list

# Conversation states
WAITING_CLARIFY_QUESTION = 3
WAITING_CLARIFY_ANSWER = 4
WAITING_REJECT_REASON = 5


async def handle_admin_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle admin button callbacks (approve, reject, clarify)."""
    query = update.callback_query
    await query.answer()
    
    # Verify it's the admin
    if query.from_user.id not in ADMIN_IDS:
        await query.answer("❌ Тільки головний регент може це робити.", show_alert=True)
        return ConversationHandler.END
    
    data = query.data
    
    if data.startswith("approve_"):
        request_id = data.replace("approve_", "")
        return await handle_approve(update, context, request_id)
    
    elif data.startswith("reject_"):
        request_id = data.replace("reject_", "")
        return await handle_reject_start(update, context, request_id)
    
    elif data.startswith("clarify_"):
        request_id = data.replace("clarify_", "")
        return await handle_clarify_start(update, context, request_id)
    
    return ConversationHandler.END


async def handle_approve(update: Update, context: ContextTypes.DEFAULT_TYPE, request_id: str) -> int:
    """Handle approval of a song request."""
    query = update.callback_query
    sheets = get_sheets_client()
    
    # Get request info
    request = sheets.get_request(request_id)
    
    if not request:
        await query.edit_message_text(
            f"❌ Заявку {request_id} не знайдено."
        )
        return ConversationHandler.END
    
    title = request.get("Назва", "Невідомо")
    username = request.get("Username", "Невідомо")
    telegram_id = request.get("Telegram ID")
    file_id = request.get("File ID", "")
    
    # Upload file to storage channel for permanent link
    file_link = None
    if STORAGE_CHANNEL_ID and file_id:
        try:
            message = await context.bot.send_document(
                chat_id=STORAGE_CHANNEL_ID,
                document=file_id,
                caption=f"🎵 {title}\n👤 Регент: {username}"
            )
            # Create permanent link
            channel_id = str(STORAGE_CHANNEL_ID).replace("-100", "")
            file_link = f"https://t.me/c/{channel_id}/{message.message_id}"
        except Exception as e:
            print(f"Error uploading to channel: {e}")
    
    # Update status
    sheets.update_status(request_id, "approved")
    
    # Add to repertoire with file link
    sheets.add_to_repertoire(title, username, file_link or "")
    
    # Update admin message (document has caption, not text)
    try:
        await query.edit_message_caption(
            caption=f"✅ Пісню «{title}» додано до репертуару.\nРегент: {username}"
        )
    except Exception as e:
        print(f"Error editing message caption: {e}")
        # Try sending a new message instead
        try:
            await context.bot.send_message(
                chat_id=query.message.chat_id,
                text=f"✅ Пісню «{title}» додано до репертуару."
            )
        except Exception as e2:
            print(f"Error sending confirmation to admin: {e2}")
    
    # Update repertoire list in group
    await update_repertoire_list(context.bot)
    
    # Notify user
    
    # Notify regent
    if telegram_id:
        try:
            await context.bot.send_message(
                chat_id=int(telegram_id),
                text=f"✅ Пісню «{title}» додано до репертуару!\n\n"
                     f"Використайте /repertoire щоб переглянути."
            )
        except Exception as e:
            print(f"Could not notify user {telegram_id}: {e}")
    
    # Update repertoire list in group
    await update_repertoire_list(context.bot)
    
    return ConversationHandler.END


async def handle_reject_start(update: Update, context: ContextTypes.DEFAULT_TYPE, request_id: str) -> int:
    """Start rejection process - ask admin for reason."""
    query = update.callback_query
    sheets = get_sheets_client()
    
    # Get request info
    request = sheets.get_request(request_id)
    
    if not request:
        await query.edit_message_text(
            f"❌ Заявку {request_id} не знайдено."
        )
        return ConversationHandler.END
    
    # Store request_id for later
    context.user_data["reject_request_id"] = request_id
    context.user_data["reject_request"] = request
    
    await query.edit_message_text(
        f"❌ Відхилення заявки «{request.get('Назва', 'Невідомо')}»\n\n"
        f"Напишіть причину відхилення для регента @{request.get('Username', 'Невідомо')}:\n"
        f"(або напишіть «-» щоб відхилити без пояснення)"
    )
    
    return WAITING_REJECT_REASON


async def handle_reject_reason(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle admin's rejection reason."""
    reason = update.message.text.strip()
    
    request_id = context.user_data.get("reject_request_id")
    request = context.user_data.get("reject_request")
    
    if not request_id or not request:
        await update.message.reply_text(
            "❌ Немає активного запиту відхилення.\n"
            "Оберіть заявку і натисніть «Відхилити»."
        )
        return ConversationHandler.END
    
    sheets = get_sheets_client()
    
    title = request.get("Назва", "Невідомо")
    username = request.get("Username", "Невідомо")
    telegram_id = request.get("Telegram ID")
    
    # Update status
    sheets.update_status(request_id, "rejected")
    
    # Prepare message for regent
    if reason == "-":
        regent_message = f"❌ Пісню «{title}» відхилено."
        admin_message = f"❌ Пісню «{title}» відхилено без пояснення."
    else:
        regent_message = f"❌ Пісню «{title}» відхилено.\n\nПричина: {reason}"
        admin_message = f"❌ Пісню «{title}» відхилено.\nПричина: {reason}"
    
    # Notify admin
    await update.message.reply_text(
        f"{admin_message}\n"
        f"Регента {username} повідомлено."
    )
    
    # Notify regent
    if telegram_id:
        try:
            await context.bot.send_message(
                chat_id=int(telegram_id),
                text=regent_message
            )
        except Exception as e:
            print(f"Could not notify user {telegram_id}: {e}")
    
    context.user_data.clear()
    return ConversationHandler.END


async def handle_clarify_start(update: Update, context: ContextTypes.DEFAULT_TYPE, request_id: str) -> int:
    """Start clarification process - ask admin for question."""
    query = update.callback_query
    sheets = get_sheets_client()
    
    # Get request info
    request = sheets.get_request(request_id)
    
    if not request:
        await query.edit_message_text(
            f"❌ Заявку {request_id} не знайдено."
        )
        return ConversationHandler.END
    
    # Store request_id for later
    context.user_data["clarify_request_id"] = request_id
    context.user_data["clarify_request"] = request
    
    # Update status
    sheets.update_status(request_id, "clarifying")
    
    await query.edit_message_text(
        f"❓ Уточнення для заявки «{request.get('Назва', 'Невідомо')}»\n\n"
        f"Напишіть ваше питання для регента @{request.get('Username', 'Невідомо')}:"
    )
    
    return WAITING_CLARIFY_QUESTION


async def handle_clarify_question(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle admin's clarification question."""
    question = update.message.text.strip()
    
    request_id = context.user_data.get("clarify_request_id")
    request = context.user_data.get("clarify_request")
    
    if not request_id or not request:
        await update.message.reply_text(
            "❌ Немає активного запиту уточнення.\n"
            "Оберіть заявку і натисніть «Уточнити»."
        )
        return ConversationHandler.END
    
    telegram_id = request.get("Telegram ID")
    title = request.get("Назва", "Невідомо")
    
    # Send question to regent and store request_id for their response
    if telegram_id:
        try:
            # Store the clarify request ID in the regent's context
            # We'll use application.bot_data to track pending clarifications
            app_data = context.application.bot_data
            if "pending_clarifications" not in app_data:
                app_data["pending_clarifications"] = {}
            
            app_data["pending_clarifications"][str(telegram_id)] = {
                "request_id": request_id,
                "title": title,
                "admin_id": CHIEF_REGENT_ID
            }
            
            await context.bot.send_message(
                chat_id=int(telegram_id),
                text=(
                    f"❓ Головний регент просить уточнення щодо пісні «{title}»:\n\n"
                    f"«{question}»\n\n"
                    f"Надішліть відповідь у цей чат."
                )
            )
            
            await update.message.reply_text(
                f"✅ Питання надіслано регенту @{request.get('Username', 'Невідомо')}.\n"
                f"Очікуйте відповідь."
            )
        except Exception as e:
            await update.message.reply_text(
                f"❌ Не вдалося надіслати питання регенту.\n"
                f"Помилка: {e}"
            )
    else:
        await update.message.reply_text(
            "❌ Не вдалося знайти Telegram ID регента."
        )
    
    context.user_data.clear()
    return ConversationHandler.END


async def invite_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate a new invite link."""
    user = update.effective_user
    if user.id not in ADMIN_IDS:
        return

    sheets = get_sheets_client()
    code = sheets.create_invite_code()
    bot_username = context.bot.username
    link = f"https://t.me/{bot_username}?start={code}"
    
    await update.message.reply_text(
        f"🔗 Нове запрошення створено!\n\n"
        f"Код: {code}\n"
        f"Посилання:\n{link}\n\n"
        f"Надішліть це посилання новому регенту.\n"
        f"Після переходу бот запитає Ім'я та Прізвище."
    )
