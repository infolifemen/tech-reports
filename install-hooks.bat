@echo off
echo ========================================
echo   Установка Git Hooks
echo ========================================
echo.

REM Активируем хуки
echo Активация pre-commit hook...
if exist ".git\hooks\pre-commit" (
    attrib -R ".git\hooks\pre-commit"
    echo   ✅ pre-commit активирован
) else (
    echo   ❌ Файл pre-commit не найден
)

echo Активация post-commit hook...
if exist ".git\hooks\post-commit" (
    attrib -R ".git\hooks\post-commit"
    echo   ✅ post-commit активирован
) else (
    echo   ❌ Файл post-commit не найден
)

echo.
echo ========================================
echo   Настройка Git config
echo ========================================
echo.

REM Устанавливаем pull.rebase = false для merge стратегии
git config pull.rebase false
echo ✅ pull.rebase = false

REM Устанавливаем auto stash
git config stash.autoStash true
echo ✅ stash.autoStash = true

echo.
echo ========================================
echo   Установка завершена!
echo ========================================
echo.
echo Теперь при каждом git commit будет:
echo   1. Автоматический pull с GitHub
echo   2. Создание коммита
echo   3. Автоматический push на GitHub
echo.
pause
