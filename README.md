# 📋 Тех. отчёты

Система учёта технических отчётов и ремонтов на Next.js + Supabase.

## 🌐 Демо

**URL:** https://infolifemen.github.io/tech-reports/

## 🔐 Авторизация

Используются те же пользователи что и в trip-schedule (Supabase RPC).

## 🚀 Деплой

Проект автоматически деплоится на GitHub Pages через GitHub Actions при push в main.

### Требуемые secrets в GitHub:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_PASSWORD`
- `NEXT_PUBLIC_APP_ID`

## 📊 База данных

Схема таблицы `tech_reports` в `create_tech_reports_table.sql`.

Импорт из Excel: `node import_excel_to_supabase.js`
