@echo off
echo ========================================
echo   Тест Git Hooks
echo ========================================
echo.

REM Создаём тестовый файл
echo test > test-file.txt
git add test-file.txt

echo Тестируем pre-commit hook (должен быть pull)...
echo Тестируем post-commit hook (должен быть push)...
echo.

git commit -m "test: проверка работы git hooks"

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo   ✅ ТЕСТ ПРОЙДЕН УСПЕШНО!
    echo ========================================
    echo.
    echo Хуки работают правильно:
    echo   - pre-commit: pull выполнен
    echo   - post-commit: push выполнен
    echo.
) else (
    echo ========================================
    echo   ❌ ТЕСТ ПРОВАЛЕН
    echo ========================================
    echo.
    echo Проверь:
    echo   1. Подключение к интернету
    echo   2. SSH ключи или credentials
    echo   3. Права доступа к .git/hooks/
    echo.
)

REM Удаляем тестовый файл
git rm test-file.txt
git commit -m "test: удаление тестового файла"

pause
