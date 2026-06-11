@echo off
setlocal

set "Path="
set "PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;C:\Program Files\nodejs;C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot\bin"

set "PS=C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
set "JAVA=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot\bin\java.exe"
set "CMD=C:\Windows\System32\cmd.exe"

"%PS%" -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -WindowStyle Hidden -FilePath '%JAVA%' -ArgumentList '-jar','target\auth-identity-service-0.0.1-SNAPSHOT.jar' -WorkingDirectory 'C:\Project\onboarding-backend' -RedirectStandardOutput 'C:\Project\onboarding-backend\codex-live-auth.log' -RedirectStandardError 'C:\Project\onboarding-backend\codex-live-auth.err.log' -PassThru | Select-Object -ExpandProperty Id"
"%PS%" -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -WindowStyle Hidden -FilePath '%JAVA%' -ArgumentList '-jar','target\employee-service-0.0.1-SNAPSHOT.jar' -WorkingDirectory 'C:\Project\employee-service' -RedirectStandardOutput 'C:\Project\employee-service\codex-live-employee.log' -RedirectStandardError 'C:\Project\employee-service\codex-live-employee.err.log' -PassThru | Select-Object -ExpandProperty Id"
"%PS%" -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -WindowStyle Hidden -FilePath '%CMD%' -ArgumentList '/c','npm.cmd run dev -- --host 127.0.0.1' -WorkingDirectory 'C:\Project\onboardingEmployee' -RedirectStandardOutput 'C:\Project\onboardingEmployee\codex-live-frontend.log' -RedirectStandardError 'C:\Project\onboardingEmployee\codex-live-frontend.err.log' -PassThru | Select-Object -ExpandProperty Id"

endlocal
