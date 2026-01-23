"""
Document handlers for processing PDF and DOCX files from regents.
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ForceReply
from telegram.ext import ContextTypes, ConversationHandler

from config import CHIEF_REGENT_ID, STORAGE_CHANNEL_ID, CATEGORIES, ADMIN_IDS
from file_parser import parse_file, normalize_title, get_file_type
from sheets_client import get_sheets_client
from repertoire_list import update_repertoire_list
from handlers.common import get_main_menu_keyboard

# Conversation states
WAITING_TITLE_CONFIRM = 1
WAITING_TITLE_INPUT = 2
WAITING_CLARIFY_ANSWER = 4
WAITING_REGENT_SELECTION = 6  # For admin direct upload
WAITING_ACTION_CHOICE = 7  # Choose between direct add or send for review
WAITING_DUPLICATE_CHOICE = 8  # Choose if fuzzy match is same or different song
WAITING_CATEGORY = 9  # Choose song category
WAITING_REGENT_NAME_MANUAL = 11  # Admin typing regent name manually

# Categories imported from config


async def upload_to_storage_channel(context, file_id: str, title: str, regent: str) -> str:
    """
    Upload file to storage channel and return permanent link.
    
    Args:
        context: Bot context
        file_id: Telegram file ID
        title: Song title
        regent: Regent name
        
    Returns:
        Permanent link to the file in channel, or None if no channel configured
    """
    if not STORAGE_CHANNEL_ID:
        return None
    
    try:
        # Send file to storage channel with caption
        message = await context.bot.send_document(
            chat_id=STORAGE_CHANNEL_ID,
            document=file_id,
            caption=f"🎵 {title}\n👤 Регент: {regent}"
        )
        
        # Create permanent link
        # For public channels: t.me/channel_username/message_id
        # For private channels: we'll use message_id reference
        if hasattr(message.chat, 'username') and message.chat.username:
            link = f"https://t.me/{message.chat.username}/{message.message_id}"
        else:
            # For private channels, create a link format that works
            channel_id = str(STORAGE_CHANNEL_ID).replace("-100", "")
            link = f"https://t.me/c/{channel_id}/{message.message_id}"
        
        return link
        
    except Exception as e:
        print(f"Error uploading to storage channel: {e}")
        return None


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle incoming document (PDF or DOCX)."""
    document = update.message.document
    user = update.effective_user
    
    # Check file type
    file_type = get_file_type(document.file_name)
    
    if file_type is None:
        await update.message.reply_text(
            "⚠️ Підтримуються тільки PDF та DOCX файли.\n"
            "Надішліть файл у правильному форматі."
        )
        return ConversationHandler.END
    
    if file_type == "doc":
        await update.message.reply_text(
            "⚠️ Формат .doc не підтримується.\n"
            "Будь ласка, конвертуйте файл у .docx або .pdf"
        )
        return ConversationHandler.END
    
    # Download file
    await update.message.reply_text("📥 Завантажую файл...")
    
    try:
        file = await context.bot.get_file(document.file_id)
        file_bytes = await file.download_as_bytearray()
    except Exception as e:
        await update.message.reply_text(
            "❌ Помилка завантаження файлу.\n"
            "Спробуйте ще раз."
        )
        return ConversationHandler.END
    
    # Store data in context (no auto-title detection)
    context.user_data["file_id"] = document.file_id
    context.user_data["file_name"] = document.file_name
    context.user_data["file_bytes"] = bytes(file_bytes)
    context.user_data["user_id"] = user.id
    # Use saved regent_name or fallback to first_name
    if not context.user_data.get("regent_name"):
        context.user_data["regent_name"] = user.first_name
    
    # Ask for title directly with ForceReply to open keyboard
    await update.message.reply_text(
        "📄 Файл отримано.\n\n"
        "Напишіть назву пісні:",
        reply_markup=ForceReply(selective=True, input_field_placeholder="Назва пісні...")
    )
    return WAITING_TITLE_INPUT


async def handle_title_confirm_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle title confirmation callback."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "title_confirm":
        # Use the suggested title
        title = context.user_data.get("auto_title")
        return await process_title(update, context, title)
    
    elif query.data == "title_edit":
        # Ask for manual input
        await query.edit_message_text(
            "✏️ Напишіть правильну назву пісні:"
        )
        return WAITING_TITLE_INPUT
    
    elif query.data == "title_cancel":
        # Cancel the upload
        await query.edit_message_text(
            "❌ Завантаження скасовано.\n"
            "Надішліть інший файл, коли будете готові."
        )
        
        # Restore main menu
        is_admin = update.effective_user.id == CHIEF_REGENT_ID
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text="Оберіть наступну дію 👇",
            reply_markup=await get_main_menu_keyboard(is_admin)
        )
        
        context.user_data.clear()
        return ConversationHandler.END
    
    return ConversationHandler.END


async def handle_title_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle manual title input."""
    title = update.message.text.strip()
    
    # Validate title
    if len(title) < 3:
        await update.message.reply_text(
            "⚠️ Назва занадто коротка.\n"
            "Введіть назву від 3 символів:"
        )
        return WAITING_TITLE_INPUT
    
    if len(title) > 200:
        await update.message.reply_text(
            "⚠️ Назва занадто довга.\n"
            "Введіть коротшу назву:"
        )
        return WAITING_TITLE_INPUT
    
    return await process_title(update, context, title)


async def process_title(update: Update, context: ContextTypes.DEFAULT_TYPE, title: str) -> int:
    """Process the title and send request to admin (or add directly if admin)."""
    # Get the right message object
    if update.callback_query:
        message = update.callback_query.message
        user_id = context.user_data.get("user_id")
        regent_name = context.user_data.get("regent_name")
    else:
        message = update.message
        user_id = update.effective_user.id
        regent_name = context.user_data.get("regent_name") or update.effective_user.username or update.effective_user.first_name
    
    normalized = normalize_title(title)
    
    # Check for duplicate
    try:
        sheets = get_sheets_client()
        is_duplicate, dup_regent, matching_title, file_link, is_exact_match = sheets.check_duplicate(normalized)
    except Exception as e:
        if update.callback_query:
            await update.callback_query.edit_message_text(
                "❌ Технічна помилка. Спробуйте пізніше."
            )
        else:
            await message.reply_text(
                "❌ Технічна помилка. Спробуйте пізніше."
            )
        context.user_data.clear()
        return ConversationHandler.END
    
    if is_duplicate:
        if not is_exact_match:
            # Fuzzy match - show both titles and ask user
            duplicate_msg = (
                f"⚠️ Схожа пісня вже є в репертуарі!\n\n"
                f"Ваша назва: «{title}»\n"
                f"В репертуарі: [{matching_title}]({file_link})\n"
                f"👤 Регент: {dup_regent}\n\n"
                f"Це та сама пісня?"
            )
            
            keyboard = [
                [
                    InlineKeyboardButton("❌ Та сама (скасувати)", callback_data="duplicate_same"),
                ],
                [
                    InlineKeyboardButton("✅ Це інша пісня", callback_data="duplicate_different")
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            # Save normalized title for later step
            context.user_data["final_title"] = title
            context.user_data["normalized_title"] = normalized
            
            if update.callback_query:
                await update.callback_query.edit_message_text(
                    duplicate_msg, 
                    reply_markup=reply_markup,
                    parse_mode="Markdown",
                    disable_web_page_preview=True
                )
            else:
                await message.reply_text(
                    duplicate_msg, 
                    reply_markup=reply_markup,
                    parse_mode="Markdown",
                    disable_web_page_preview=True
                )
            return WAITING_DUPLICATE_CHOICE
            
        else:
            # Exact match
            if file_link:
                duplicate_msg = (
                    f"⚠️ Пісня «[{title}]({file_link})» вже є в репертуарі.\n"
                    f"👤 Регент: {dup_regent}\n\n"
                    f"Файл не надіслано на розгляд."
                )
            else:
                duplicate_msg = (
                    f"⚠️ Пісня «{title}» вже є в репертуарі.\n"
                    f"👤 Регент: {dup_regent}\n\n"
                    f"Файл не надіслано на розгляд."
                )
                
            if update.callback_query:
                await update.callback_query.edit_message_text(
                    duplicate_msg,
                    parse_mode="Markdown",
                    disable_web_page_preview=True
                )
                # Restore keyboard
                await context.bot.send_message(
                    chat_id=update.callback_query.message.chat_id,
                    text="Оберіть наступну дію 👇",
                    reply_markup=await get_main_menu_keyboard(update.effective_user.id in ADMIN_IDS)
                )
            else:
                await message.reply_text(
                    duplicate_msg,
                    parse_mode="Markdown",
                    disable_web_page_preview=True,
                    reply_markup=await get_main_menu_keyboard(user_id == CHIEF_REGENT_ID)
                )
            context.user_data.clear()
            return ConversationHandler.END
    
    # Save title for later use
    context.user_data["final_title"] = title
    context.user_data["normalized_title"] = normalized
    
    # Ask for category
    return await ask_category(update, context)


async def ask_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Ask user to select a category."""
    keyboard = []
    row = []
    for category in CATEGORIES:
        row.append(InlineKeyboardButton(category, callback_data=f"category_{category}"))
        if len(row) == 2:  # 2 categories per row
            keyboard.append(row)
            row = []
    if row:
        keyboard.append(row)
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    text = (
        f"📂 Оберіть категорію для пісні:\n"
        f"«{context.user_data.get('final_title')}»"
    )
    
    if update.callback_query:
        await update.callback_query.edit_message_text(text, reply_markup=reply_markup)
    else:
        await update.message.reply_text(text, reply_markup=reply_markup)
        
    return WAITING_CATEGORY


async def handle_category_choice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle category selection."""
    query = update.callback_query
    await query.answer()
    
    category = query.data.replace("category_", "")
    context.user_data["category"] = category
    
    return await proceed_after_category(update, context)


async def proceed_after_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Proceed flow after category is selected."""
    message = update.callback_query.message if update.callback_query else update.message
    
    user_id = context.user_data.get("user_id")
    title = context.user_data.get("final_title")
    category = context.user_data.get("category")
    
    # Check if this is admin - ask for regent name before adding
    if user_id in ADMIN_IDS:
        keyboard = []
        # Add "Myself"
        keyboard.append([InlineKeyboardButton("👤 Я сам", callback_data="regent_self")])
        
        # Add Regents
        sheets = get_sheets_client()
        regents = sheets.get_all_regents()
        for r in regents:
            name = r.get("Name", "Невідомо")
            rid = r.get("ID") # UUID
            if rid:
                keyboard.append([InlineKeyboardButton(f"👤 {name}", callback_data=f"regent_sel_{rid}")])
        
        # Add manual input option
        keyboard.append([InlineKeyboardButton("✏️ Ввести ім'я вручну", callback_data="regent_manual")])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        prompt = (
            f"📄 Назва: «{title}»\n"
            f"📂 Категорія: {category}\n\n"
            f"👤 Оберіть регента або введіть ім'я:"
        )
        await message.edit_text(prompt, reply_markup=reply_markup)
        
        return WAITING_REGENT_SELECTION
    
    # Show action choice to user
    keyboard = [
        [
            InlineKeyboardButton("📋 Додати в репертуар", callback_data="action_add_direct"),
        ],
        [
            InlineKeyboardButton("📤 Відправити на перевірку", callback_data="action_send_review")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    choice_text = (
        f"📄 Назва: «{title}»\n"
        f"📂 Категорія: {category}\n\n"
        f"Оберіть дію:"
    )
    
    await message.edit_text(choice_text, reply_markup=reply_markup)
    return WAITING_ACTION_CHOICE


async def handle_action_choice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle user's choice to add directly or send for review."""
    query = update.callback_query
    await query.answer()
    
    title = context.user_data.get("final_title")
    normalized = context.user_data.get("normalized_title")
    user_id = context.user_data.get("user_id")
    regent_name = context.user_data.get("regent_name")
    file_id = context.user_data.get("file_id")
    category = context.user_data.get("category", "Інші")
    
    if not title:
        await query.edit_message_text("❌ Сталася помилка. Спробуйте ще раз.")
        context.user_data.clear()
        return ConversationHandler.END
    
    sheets = get_sheets_client()
    
    if query.data == "action_add_direct":
        # Add directly to repertoire
        try:
            # Upload to storage channel
            file_link = await upload_to_storage_channel(context, file_id, title, regent_name)
            
            # Add to repertoire
            sheets.add_to_repertoire(title, regent_name, file_link or "", category=category)
            
            await query.edit_message_text(
                f"✅ Пісню «{title}» додано до репертуару!\n"
                f"📂 Категорія: {category}\n\n"
                f"Використайте /repertoire щоб переглянути."
            )
        except Exception as e:
            print(f"Error in action_add_direct: {e}")
            # Try to send new message if edit fails
            try:
                await context.bot.send_message(
                    chat_id=query.message.chat_id,
                    text=f"✅ Пісню «{title}» додано до репертуару!\n\n"
                         f"Використайте /repertoire щоб переглянути."
                )
            except Exception as e2:
                print(f"Error sending confirmation: {e2}")
        
        # Update repertoire list in group
        await update_repertoire_list(context.bot)
        
        # Restore main menu
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text="Оберіть наступну дію 👇",
            reply_markup=await get_main_menu_keyboard(user_id in ADMIN_IDS)
        )
        
        context.user_data.clear()
        return ConversationHandler.END
    
    elif query.data == "action_send_review":
        # Send for admin review
        try:
            request_id = sheets.create_request(
                title=title,
                normalized_title=normalized,
                telegram_id=user_id,
                username=regent_name,
                file_id=file_id,
                auto_title=context.user_data.get("auto_title"),
                file_link=None,
                category=category
            )
        except Exception as e:
            await query.edit_message_text("❌ Технічна помилка при створенні заявки.")
            context.user_data.clear()
            return ConversationHandler.END
        
        # Send to admin with file and buttons
        keyboard = [
            [
                InlineKeyboardButton("✅ Підтвердити", callback_data=f"approve_{request_id}"),
                InlineKeyboardButton("❌ Відхилити", callback_data=f"reject_{request_id}")
            ],
            [
                InlineKeyboardButton("❓ Уточнити", callback_data=f"clarify_{request_id}")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        caption = (
            f"📥 Нова заявка від {regent_name}\n\n"
            f"Назва: «{title}»\n"
            f"📂 Категорія: {category}\n"
            f"ID заявки: {request_id}"
        )
        
        try:
            admin_message = await context.bot.send_document(
                chat_id=CHIEF_REGENT_ID,
                document=file_id,
                caption=caption,
                reply_markup=reply_markup
            )
            sheets.update_message_id(request_id, admin_message.message_id)
        except Exception as e:
            await query.edit_message_text("❌ Помилка при надсиланні заявки.")
            context.user_data.clear()
            return ConversationHandler.END
        
        await query.edit_message_text(
            f"✅ Пісню «{title}» надіслано.\n\n"
            f"Після підтвердження пісня з'явиться в репертуарі.")
        
        # Restore main menu
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text="Оберіть наступну дію 👇",
            reply_markup=await get_main_menu_keyboard(user_id in ADMIN_IDS)
        )
        
        context.user_data.clear()
        return ConversationHandler.END
    
    return ConversationHandler.END


async def handle_duplicate_choice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle user's choice when duplicate is found."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "duplicate_same":
        await query.edit_message_text("❌ Дію скасовано.")
        
        # Restore main menu
        is_admin = update.effective_user.id == CHIEF_REGENT_ID
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text="Оберіть наступну дію 👇",
            reply_markup=await get_main_menu_keyboard(is_admin)
        )
        
        context.user_data.clear()
        return ConversationHandler.END
        
    elif query.data == "duplicate_different":
        # Ask for category instead of showing action choice immediately
        return await ask_category(update, context)
        
    return ConversationHandler.END

async def handle_clarify_answer(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle regent's answer to clarification request."""
    answer = update.message.text.strip()
    user_id = str(update.effective_user.id)
    
    # Check for pending clarification in bot_data
    app_data = context.application.bot_data
    pending = app_data.get("pending_clarifications", {}).get(user_id)
    
    if not pending:
        # No pending clarification - this is just a regular message, ignore
        return ConversationHandler.END
    
    request_id = pending.get("request_id")
    title = pending.get("title")
    admin_id = pending.get("admin_id") # Use stored admin_id
    if not admin_id: admin_id = CHIEF_REGENT_ID
    
    # Get request info for username
    sheets = get_sheets_client()
    request = sheets.get_request(request_id)
    username = request.get("Username", "Невідомо") if request else "Невідомо"
    
    # Create keyboard with approve/reject buttons
    keyboard = [
        [
            InlineKeyboardButton("✅ Підтвердити", callback_data=f"approve_{request_id}"),
            InlineKeyboardButton("❌ Відхилити", callback_data=f"reject_{request_id}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Send answer to admin with action buttons
    try:
        await context.bot.send_message(
            chat_id=admin_id,
            text=(
                f"📩 Відповідь на уточнення\n\n"
                f"Заявка: {request_id}\n"
                f"Назва: «{title}»\n"
                f"Від: {username}\n\n"
                f"Відповідь:\n{answer}"
            ),
            reply_markup=reply_markup
        )
        
        await update.message.reply_text(
            "✅ Відповідь надіслано головному регенту.\n"
            "Очікуйте рішення."
        )
        
        # Remove pending clarification
        del app_data["pending_clarifications"][user_id]
        
    except Exception as e:
        await update.message.reply_text(
            "❌ Помилка при надсиланні відповіді."
        )
    
    return ConversationHandler.END


async def handle_regent_selection_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle admin's selection of regent when adding song directly."""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    
    # Handle manual input request
    if data == "regent_manual":
        title = context.user_data.get("final_title")
        category = context.user_data.get("category", "Інші")
        await query.edit_message_text(
            f"📄 Назва: «{title}»\n"
            f"📂 Категорія: {category}\n\n"
            f"✏️ Введіть ім'я регента:"
        )
        return WAITING_REGENT_NAME_MANUAL
    
    # Get stored data
    title = context.user_data.get("final_title")
    normalized = context.user_data.get("normalized_title")
    file_bytes = context.user_data.get("file_bytes")
    file_name = context.user_data.get("file_name")
    category = context.user_data.get("category", "Інші")
    
    # Determine regent name
    regent_name = "Невідомо"
    
    if data == "regent_self":
        # Get admin name or stored name
        user = update.effective_user
        regent_name = user.first_name
        saved = context.user_data.get("regent_name")
        if saved: regent_name = saved
        
    elif data.startswith("regent_sel_"):
        rid = data.replace("regent_sel_", "")
        sheets = get_sheets_client()
        regents = sheets.get_all_regents()
        found = next((r for r in regents if r["ID"] == rid), None)
        if found:
            regent_name = found["Name"]
    
    # Upload to storage channel for permanent link
    try:
        file_link = await upload_to_storage_channel(
            context,
            context.user_data.get("file_id"),
            title,
            regent_name
        )
        
        # Add directly to repertoire
        sheets = get_sheets_client()
        
        # Create request record for history
        sheets.create_request(
            title=title,
            normalized_title=normalized,
            telegram_id=update.effective_user.id, # Use actual admin ID
            username=regent_name,
            file_id=context.user_data.get("file_id"),
            auto_title=context.user_data.get("auto_title"),
            file_link=file_link,
            category=category
        )
        
        # Add to repertoire
        sheets.add_to_repertoire(title, regent_name, file_link, category=category)
        
        await query.edit_message_text(
            f"✅ Пісню «{title}» додано до репертуару!\n"
            f"📂 Категорія: {category}\n"
            f"👤 Регент: {regent_name}"
        )
        
        # Restore main menu via new message
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text="Оберіть наступну дію 👇",
            reply_markup=await get_main_menu_keyboard(True)
        )
        
        # Update repertoire list in group
        await update_repertoire_list(context.bot)
        
    except Exception as e:
        await query.edit_message_text(f"❌ Помилка: {e}")
    
    context.user_data.clear()
    return ConversationHandler.END


async def handle_regent_name_manual_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle admin's manual text input for regent name."""
    regent_name = update.message.text.strip()
    
    if len(regent_name) < 2:
        await update.message.reply_text("⚠️ Ім'я занадто коротке. Введіть ім'я регента:")
        return WAITING_REGENT_NAME_MANUAL
    
    # Get stored data
    title = context.user_data.get("final_title")
    normalized = context.user_data.get("normalized_title")
    category = context.user_data.get("category", "Інші")
    
    # Upload to storage channel for permanent link
    try:
        file_link = await upload_to_storage_channel(
            context,
            context.user_data.get("file_id"),
            title,
            regent_name
        )
        
        # Add directly to repertoire
        sheets = get_sheets_client()
        
        # Create request record for history
        sheets.create_request(
            title=title,
            normalized_title=normalized,
            telegram_id=update.effective_user.id,
            username=regent_name,
            file_id=context.user_data.get("file_id"),
            auto_title=context.user_data.get("auto_title"),
            file_link=file_link,
            category=category
        )
        
        # Add to repertoire
        sheets.add_to_repertoire(title, regent_name, file_link, category=category)
        
        await update.message.reply_text(
            f"✅ Пісню «{title}» додано до репертуару!\n"
            f"📂 Категорія: {category}\n"
            f"👤 Регент: {regent_name}",
            reply_markup=await get_main_menu_keyboard(True)
        )
        
        # Update repertoire list in group
        await update_repertoire_list(context.bot)
        
    except Exception as e:
        await update.message.reply_text(f"❌ Помилка: {e}")
    
    context.user_data.clear()
    return ConversationHandler.END
