@echo off
cd /d C:\Users\exdik\Qwen-Workspace\tech_reports
echo Starting npm install... > npm_install_log.txt
echo Time: %date% %time% >> npm_install_log.txt
echo ========================== >> npm_install_log.txt
npm install >> npm_install_log.txt 2>&1
echo ========================== >> npm_install_log.txt
echo Exit code: %ERRORLEVEL% >> npm_install_log.txt
echo Time: %date% %time% >> npm_install_log.txt
echo DONE >> npm_install_log.txt
