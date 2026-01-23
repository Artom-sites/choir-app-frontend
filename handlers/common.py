"""
Common command handlers for the Telegram bot.
"""

from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import ContextTypes, ConversationHandler

from config import CHIEF_REGENT_ID, ADMIN_IDS
from repertoire_list import get_repertoire_message_link
from sheets_client import get_sheets_client

# Conversation state for name input
WAITING_REGENT_NAME_REGISTRATION = 10


async def get_main_menu_keyboard(is_admin: bool) -> ReplyKeyboardMarkup:
    """Get the main menu keyboard."""
    if is_admin:
        keyboard = [
            [KeyboardButton("➕ Додати пісню")],
            [KeyboardButton("📂 Репертуар")]
        ]
    else:
        keyboard = [
            [KeyboardButton("➕ Додати пісню")],
            [KeyboardButton("📂 Репертуар")]
        ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle /start command."""
    user = update.effective_user
    is_admin = user.id in ADMIN_IDS
    
    # Check if admin FIRST - admins always have access
    if is_admin:
        message = (
            f"👋 Вітаю, головний регенте!\n\n"
            f"Ви маєте повноваження:\n"
            f"• Додавати пісні без підтвердження\n"
            f"• Підтверджувати заявки на пісні\n"
            f"• Відхиляти заявки\n"
            f"• Просити уточнення\n\n"
            f"• Створити запрошення: /invite\n\n"
            f"Оберіть дію в меню 👇"
        )
        await update.message.reply_text(
            message,
            reply_markup=await get_main_menu_keyboard(True)
        )
        return ConversationHandler.END
    
    sheets = get_sheets_client()
    
    # Check if authorized regent
    if sheets.is_regent(user.id):
        message = (
            f"👋 Вітаю!\n\n"
            f"Ви успішно авторизовані.\n\n"
            f"Оберіть дію в меню 👇"
        )
        await update.message.reply_text(
            message,
            reply_markup=await get_main_menu_keyboard(False)
        )
        return ConversationHandler.END
    
    # Check invite code in args
    args = context.args
    if args and len(args) > 0:
        invite_code = args[0]
        regent_data = sheets.get_regent_by_code(invite_code)
        
        if regent_data:
            # Code valid, ask for name
            context.user_data["invite_code"] = invite_code
            await update.message.reply_text(
                "👋 Вітаю!\n\n"
                "Запрошення прийнято.\n"
                "Будь ласка, введіть Ваше Ім'я та Прізвище (наприклад: Іван Петров):"
            )
            return WAITING_REGENT_NAME_REGISTRATION
        else:
            await update.message.reply_text("❌ Невірний або використаний код запрошення.")
            return ConversationHandler.END
    
    # Not authorized and no code
    await update.message.reply_text(
        "⛔️ Доступ заборонено.\n\n"
        "Цей бот доступний тільки для авторизованих регентів.\n"
        "Зверніться до головного регента за запрошенням."
    )
    return ConversationHandler.END


async def handle_regent_name_registration(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle name input for new regent registration."""
    name = update.message.text.strip()
    invite_code = context.user_data.get("invite_code")
    user = update.effective_user
    
    if len(name) < 2:
        await update.message.reply_text("⚠️ Ім'я занадто коротке. Введіть Ім'я та Прізвище:")
        return WAITING_REGENT_NAME_REGISTRATION
    
    sheets = get_sheets_client()
    success = sheets.register_regent(invite_code, user.id, user.username, name)
    
    if success:
        context.user_data["regent_name"] = name  # Cache locally
        await update.message.reply_text(
            f"✅ Реєстрація успішна!\n"
            f"Ласкаво просимо, {name}.\n\n"
            f"Тепер ви можете додавати пісні.",
            reply_markup=await get_main_menu_keyboard(False)
        )
        return ConversationHandler.END
    else:
        await update.message.reply_text("❌ Помилка реєстрації. Спробуйте ще раз /start з кодом.")
        return ConversationHandler.END


# Removed handle_name_input (old logic)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command."""
    user = update.effective_user
    is_admin = user.id in ADMIN_IDS
    
    await update.message.reply_text(
        "Якщо у вас є питання — пишіть головному регенту.",
        reply_markup=await get_main_menu_keyboard(is_admin)
    )

async def handle_add_song_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle 'Add Song' button from main menu."""
    await update.message.reply_text(
        "Щоб додати пісню — просто надішліть мені PDF файл."
    )



async def repertoire_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /repertoire command - show link to repertoire in group."""
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
    from repertoire_list import get_repertoire_message_link
    
    link = get_repertoire_message_link()
    
    if link:
        keyboard = [[InlineKeyboardButton("📁 Відкрити список пісень", url=link)]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(
            "📋 *Репертуар хору*\n\n"
            "Повний список пісень доступний у групі за посиланням нижче 👇",
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )
    else:
        # Fallback if no link yet
        await update.message.reply_text(
            "📋 Список репертуару ще не створено.\n"
            "Додайте першу пісню, щоб створити список."
        )



async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle /cancel command."""
    user = update.effective_user
    is_admin = user.id in ADMIN_IDS
    
    # Clear conversation data but keep regent_name
    regent_name = context.user_data.get("regent_name")
    context.user_data.clear()
    if regent_name:
        context.user_data["regent_name"] = regent_name
    
    await update.message.reply_text(
        "❌ Дію скасовано.\n\n"
        "Оберіть наступну дію 👇",
        reply_markup=await get_main_menu_keyboard(is_admin)
    )
    
    return ConversationHandler.END


async def unknown_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle unknown commands."""
    await update.message.reply_text(
        "🤔 Невідома команда.\n"
        "Використайте /help для довідки."
    )

