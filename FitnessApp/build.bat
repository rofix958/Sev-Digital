@echo off
REM بناء تطبيق حاسبة السعرات والتغذية (واجهة رسومية)
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /codepage:65001 /win32icon:app.ico /out:HealthFit.exe /r:System.dll /r:System.Core.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll Program.cs
if exist HealthFit.exe (
    echo تم بناء التطبيق بنجاح: HealthFit.exe
    start HealthFit.exe
) else (
    echo فشل البناء!
    pause
)