# Script Otomatis Build APK WebView untuk Finance
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "         Finance - APK Builder            " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Pastikan dependensi Capacitor terpasang
Write-Host "`n[1/4] Memeriksa & Menginstall Capacitor..." -ForegroundColor Yellow
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Build aplikasi web React Vite
Write-Host "`n[2/4] Melakukan build web (Vite)..." -ForegroundColor Yellow
npm run build

# 3. Setup / Sync platform Android
Write-Host "`n[3/4] Menyiapkan platform Android..." -ForegroundColor Yellow
if (-not (Test-Path "android")) {
    Write-Host "Menambahkan folder platform android..." -ForegroundColor Green
    npx cap add android
}
npx cap sync android

# 4. Panduan langkah akhir
Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  Proses Sinkronisasi Selesai!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Untuk menghasilkan file .APK:" -ForegroundColor White
Write-Host "Opsi 1 (Paling Mudah via Android Studio):" -ForegroundColor Cyan
Write-Host "  Jalankan: npx cap open android" -ForegroundColor White
Write-Host "  Lalu klik menu: Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor White
Write-Host "`nOpsi 2 (Langsung via Terminal / Command Line):" -ForegroundColor Cyan
Write-Host "  cd android" -ForegroundColor White
Write-Host "  .\gradlew assembleDebug" -ForegroundColor White
Write-Host "  File APK akan berada di:" -ForegroundColor White
Write-Host "  android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green
