# Telegram-бот для хорового репертуару

Бот для управління репертуаром хору. Регенти надсилають PDF/DOCX файли пісень, вводять назву, бот перевіряє на дублікати та надсилає заявку головному регенту на затвердження.

## Вимоги

- Python 3.10+
- Telegram Bot Token (від @BotFather)
- Google Cloud Service Account з доступом до Sheets API

## Встановлення

### 1. Клонування та залежності

```bash
cd "telegram app"
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Створення Telegram бота

1. Відкрийте [@BotFather](https://t.me/BotFather) в Telegram
2. Надішліть `/newbot`
3. Введіть назву бота (наприклад: "Репертуар Хору")
4. Введіть username бота (наприклад: `choir_repertoire_bot`)
5. Скопіюйте токен

### 3. Налаштування Google Sheets API

1. Перейдіть на [Google Cloud Console](https://console.cloud.google.com/)
2. Створіть новий проект
3. Увімкніть **Google Sheets API** та **Google Drive API**
4. Створіть **Service Account**:
   - IAM & Admin → Service Accounts → Create
   - Дайте ім'я (наприклад: `choir-bot`)
   - Створіть ключ → JSON
   - Збережіть файл як `credentials.json` в папці проекту

### 4. Створення Google Таблиці

1. Створіть нову таблицю в Google Sheets
2. Скопіюйте ID таблиці з URL:
   ```
   https://docs.google.com/spreadsheets/d/[ЦЕ_ID]/edit
   ```
3. Поділіться таблицею з email Service Account (з `credentials.json`, поле `client_email`)
4. Дайте права **Editor**

### 5. Конфігурація

Створіть файл `.env`:

```env
TELEGRAM_TOKEN=your_bot_token_here
CHIEF_REGENT_ID=123456789
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_CREDENTIALS_FILE=credentials.json
```

**Як отримати свій Telegram ID:**
- Напишіть боту [@userinfobot](https://t.me/userinfobot)
- Він надішле вам ваш ID

### 6. Запуск

```bash
python bot.py
```

## Структура таблиці

Бот автоматично створить потрібні аркуші:

### Репертуар (публічний)
| Назва | Додано | Регент |
|-------|--------|--------|
| Христос Воскрес | 2025-01-21 | @username |

### База (технічний)
| ID | Назва | Статус | ... |
|----|-------|--------|-----|
| abc123 | Христос Воскрес | approved | ... |

## Використання

### Для регентів:
1. Надішліть PDF або DOCX файл пісні
2. Підтвердіть або введіть назву
3. Очікуйте рішення головного регента

### Для головного регента:
- **✅ Підтвердити** — додати пісню до репертуару
- **❌ Відхилити** — відхилити заявку
- **❓ Уточнити** — запитати додаткову інформацію

## Команди

- `/start` — початок роботи
- `/help` — довідка
- `/cancel` — скасувати поточну дію
