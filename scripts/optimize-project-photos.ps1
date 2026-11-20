# Genera fotos optimizadas de proyectos reales para src/assets/projects/
# Origen: public/images/project/ (carpetas sin procesar, ~170 MB)
# Destino: src/assets/projects/<slug>/01..05.jpg (max 1600px, JPEG q82)
# Uso: powershell -ExecutionPolicy Bypass -File scripts/optimize-project-photos.ps1
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$srcBase = Join-Path $root "public\images\project"
$destBase = Join-Path $root "src\assets\projects"

# slug = nombre legible en projects.ts | carpeta origen | archivos curados (01 = portada)
$projects = @(
  @{ Slug = "greco-1-y2";      Folder = "EXEQUIEL FERMANDEZ (GRECO 1 Y2)";     Files = @("IMG_3254.jpg", "10c6c307-d3a2-4e79-90a6-14fa0e1b3650.JPG", "IMG_3256.jpg", "IMG_3265.jpg", "IMG_3248.jpg") },
  @{ Slug = "aurora";          Folder = "FOTOS AURORA ANTOFAGASTA";            Files = @("PHOTO-2026-08-20-14-36-23.jpg", "PHOTO-2026-08-18-13-30-23_1.jpg", "IMG_6986.jpg", "IMG_6981.jpg", "PHOTO-2026-08-20-14-36-23_2.jpg") },
  @{ Slug = "corona-maipu";    Folder = "FOTOS CORONA MAIPU";                  Files = @("IMG_8376.jpeg", "IMG_8449.jpeg", "IMG_8399.jpeg", "IMG_8390.jpeg", "IMG_8423.jpeg") },
  @{ Slug = "don-claudio";     Folder = "FOTOS DON CLAUDIO # 1728";            Files = @("a8a5c978-3c31-491c-af93-48d25f274610.JPG", "c6d8d58b-7723-4463-a84d-9fca9674d945.JPG", "IMG_2816.jpg", "IMG_2849.jpg", "IMG_2864.jpg") },
  @{ Slug = "gran-pacifico-2"; Folder = "FOTOS GRAN PACIFICO 2 ANTOFAGASTA";   Files = @("IMG_1429.jpeg", "IMG_1425.jpeg", "IMG_1433.jpeg", "IMG_1474.jpeg", "IMG_1436.jpeg") },
  @{ Slug = "lo-ovalle";       Folder = "FOTOS LO OVALLE # 0926";              Files = @("1000185733.jpg", "IMG_2415.jpg", "IMG_2454.jpg", "IMG_2480.jpg", "IMG_2432.jpg") },
  @{ Slug = "san-nicolas";     Folder = "FOTOS SAN NICOLAS # 1346";            Files = @("PHOTO-2025-07-29-10-34-16.jpg", "PHOTO-2025-09-12-16-13-54.jpg", "PHOTO-2025-07-29-10-34-24.jpg", "IMG_3958.PNG", "PHOTO-2025-07-29-10-34-20.jpg") },
  @{ Slug = "tempo-trinidad";  Folder = "FOTOS TEMPO TRINIDAD # 1533";         Files = @("PHOTO-2026-04-23-11-27-33.jpg", "IMG_6896.jpg", "IMG_6871.jpg", "IMG_6897.jpg", "IMG_6905.jpg") },
  @{ Slug = "venecia";         Folder = "FOTOS VENECIA";                       Files = @("IMG_9128.jpeg", "IMG_9123.jpeg", "IMG_9120.jpeg", "IMG_9174.jpeg", "IMG_9236.jpeg") }
)

$maxDim = 1600
$quality = 82
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

foreach ($project in $projects) {
  $srcDir = Join-Path $srcBase $project.Folder
  $destDir = Join-Path $destBase $project.Slug
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  $n = 0
  foreach ($file in $project.Files) {
    $n++
    $srcPath = Join-Path $srcDir $file
    if (-not (Test-Path $srcPath)) { throw "No existe: $srcPath" }
    $destPath = Join-Path $destDir ("{0:D2}.jpg" -f $n)

    $img = [System.Drawing.Image]::FromFile($srcPath)

    # corregir orientación EXIF (GDI+ no la aplica solo)
    $orientation = 1
    foreach ($prop in $img.PropertyItems) {
      if ($prop.Id -eq 0x0112) { $orientation = $prop.Value[0]; break }
    }
    switch ($orientation) {
      2 { $img.RotateFlip([System.Drawing.RotateFlipType]::FlipX) }
      3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
      4 { $img.RotateFlip([System.Drawing.RotateFlipType]::FlipY) }
      5 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipX) }
      6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
      7 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipX) }
      8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
    }

    $scale = [math]::Min([double]$maxDim / [math]::Max($img.Width, $img.Height), [double]1)
    $w = [int]($img.Width * $scale)
    $h = [int]($img.Height * $scale)

    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    $img.Dispose()

    $bmp.Save($destPath, $jpegCodec, $encoderParams)
    $bmp.Dispose()

    $kb = [math]::Round((Get-Item $destPath).Length / 1KB)
    Write-Output "$($project.Slug)/$("{0:D2}.jpg" -f $n) ${w}x${h} ${kb} KB"
  }
}
