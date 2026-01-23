"""
Telegram Bot for Choir Repertoire Management

This bot allows regents to submit songs for review by the chief regent.
Songs are stored in Google Sheets.
"""

import logging

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ConversationHandler,
    filters,
    PicklePersistence,
)

from config import TELEGRAM_TOKEN, CHIEF_REGENT_ID, ADMIN_IDS, validate_config
from handlers.common import (
    start_command, 
    help_command, 
    cancel_command,
    handle_regent_name_registration,
    repertoire_command,
    handle_add_song_button,
    WAITING_REGENT_NAME_REGISTRATION,
)
from handlers.document import (
    handle_document,
    handle_title_confirm_callback,
    handle_title_input,
    handle_clarify_answer,
    handle_regent_selection_callback,
    handle_regent_name_manual_input,
    handle_action_choice,
    handle_duplicate_choice,
    handle_category_choice,
    WAITING_TITLE_CONFIRM,
    WAITING_TITLE_INPUT,
    WAITING_CLARIFY_ANSWER,
    WAITING_REGENT_SELECTION,
    WAITING_REGENT_NAME_MANUAL,
    WAITING_ACTION_CHOICE,
    WAITING_DUPLICATE_CHOICE,
    WAITING_CATEGORY,
)
from handlers.admin import (
    handle_admin_callback,
    handle_clarify_question,
    handle_reject_reason,
    invite_command,
    WAITING_CLARIFY_QUESTION,
    WAITING_REJECT_REASON,
)

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)


def main():
    """Start the bot."""
    # Validate configuration
    try:
        validate_config()
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        return
    
    # Create persistence object
    persistence = PicklePersistence(filepath="bot_data.pickle")
    
    # Create application with persistence
    application = Application.builder().token(TELEGRAM_TOKEN).persistence(persistence).build()
    
    # Add menu button handlers (must be before ConversationHandler to work outside of it)
    application.add_handler(MessageHandler(filters.Regex("^➕ Додати пісню$"), handle_add_song_button))
    application.add_handler(MessageHandler(filters.Regex("^📂 Репертуар$"), repertoire_command))
    
    # Conversation handler for /start (name registration)
    start_conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("start", start_command)
        ],
        states={
            WAITING_REGENT_NAME_REGISTRATION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_regent_name_registration)
            ],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_command)
        ],
        per_user=True,
        per_chat=True,
        name="start_conversation",
        persistent=True,
    )
    
    # Conversation handler for document submission (regular users)
    document_conv_handler = ConversationHandler(
        entry_points=[
            MessageHandler(
                filters.Document.ALL & ~filters.User(ADMIN_IDS),
                handle_document
            )
        ],
        states={
            WAITING_TITLE_CONFIRM: [
                CallbackQueryHandler(handle_title_confirm_callback, pattern="^title_")
            ],
            WAITING_TITLE_INPUT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_title_input)
            ],
            WAITING_CLARIFY_ANSWER: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_clarify_answer)
            ],
            WAITING_ACTION_CHOICE: [
                CallbackQueryHandler(handle_action_choice, pattern="^action_")
            ],
            WAITING_DUPLICATE_CHOICE: [
                CallbackQueryHandler(handle_duplicate_choice, pattern="^duplicate_")
            ],
            WAITING_CATEGORY: [
                CallbackQueryHandler(handle_category_choice, pattern="^category_")
            ],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_command)
        ],
        per_user=True,
        per_chat=True,
        name="document_submission",
        persistent=True,
    )
    
    # Conversation handler for admin (chief regent)
    admin_conv_handler = ConversationHandler(
        entry_points=[
            CallbackQueryHandler(
                handle_admin_callback,
                pattern="^(approve_|reject_|clarify_)"
            ),
            # Admin can also send documents - they go directly without approval
            MessageHandler(
                filters.Document.ALL & filters.User(ADMIN_IDS),
                handle_document  # Same handler but with admin privileges
            )
        ],
        states={
            WAITING_CLARIFY_QUESTION: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND & filters.User(ADMIN_IDS),
                    handle_clarify_question
                )
            ],
            WAITING_REJECT_REASON: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND & filters.User(ADMIN_IDS),
                    handle_reject_reason
                )
            ],
            WAITING_REGENT_SELECTION: [
                CallbackQueryHandler(handle_regent_selection_callback, pattern="^(regent_self|regent_sel_|regent_manual)")
            ],
            WAITING_REGENT_NAME_MANUAL: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND & filters.User(ADMIN_IDS),
                    handle_regent_name_manual_input
                )
            ],
            WAITING_TITLE_CONFIRM: [
                CallbackQueryHandler(handle_title_confirm_callback, pattern="^title_")
            ],
            WAITING_TITLE_INPUT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, handle_title_input)
            ],
            WAITING_CATEGORY: [
                CallbackQueryHandler(handle_category_choice, pattern="^category_")
            ],
        },
        fallbacks=[
            CommandHandler("cancel", cancel_command)
        ],
        per_user=True,
        per_chat=True,
        name="admin_workflow",
        persistent=True,
    )
    
    # Global handler for clarification answers from regents
    clarify_answer_handler = MessageHandler(
        filters.TEXT & ~filters.COMMAND & ~filters.User(ADMIN_IDS),
        handle_clarify_answer
    )
    
    # Add handlers
    application.add_handler(start_conv_handler)
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("repertoire", repertoire_command))
    application.add_handler(CommandHandler("invite", invite_command))
    application.add_handler(admin_conv_handler)  # Admin FIRST to catch admin documents
    application.add_handler(document_conv_handler)
    application.add_handler(clarify_answer_handler)  # For regent clarification answers
    
    # Set bot commands for menu
    async def post_init(app):
        from telegram import BotCommand, BotCommandScopeChat
        
        # Commands for regular users
        commands = [
            BotCommand("start", "🔄 Перезавантажити"),
            BotCommand("help", "❓ Допомога"),
            BotCommand("cancel", "❌ Скасувати дію"),
        ]
        await app.bot.set_my_commands(commands)
        
        # Admin commands (includes /invite)
        admin_commands = [
            BotCommand("start", "🔄 Перезавантажити"),
            BotCommand("invite", "🔗 Створити запрошення"),
            BotCommand("help", "❓ Допомога"),
            BotCommand("cancel", "❌ Скасувати дію"),
        ]
        for admin_id in ADMIN_IDS:
            try:
                await app.bot.set_my_commands(
                    admin_commands, 
                    scope=BotCommandScopeChat(chat_id=admin_id)
                )
            except Exception as e:
                logger.warning(f"Could not set admin commands for {admin_id}: {e}")
    
    application.post_init = post_init
    
    # Log startup
    logger.info("Bot is starting...")
    logger.info(f"Chief Regent ID: {CHIEF_REGENT_ID}")
    
    # Start polling
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
