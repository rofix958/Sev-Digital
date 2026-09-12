@echo off
REM بناء تطبيق حاسبة السعرات بلغة C#
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /codepage:65001 /out:CalorieApp.exe Program.cs
echo.
if exist CalorieApp.exe (
    echo تم بناء التطبيق بنجاح: CalorieApp.exe
) else (
    echo فشل البناء!
    pause
)