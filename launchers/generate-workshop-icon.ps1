# Generates a Windows .ico file for Twis Holo Workshop launchers.
# No external dependency. Uses built-in .NET drawing on Windows.

param(
  [string]$OutPath = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
if (-not $OutPath) {
  $OutPath = Join-Path $repoRoot "app\assets\icons\twis-holo-icon.ico"
}
$outDir = Split-Path -Parent $OutPath
if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# Background: dark holo shield/circle.
$bgRect = New-Object System.Drawing.Rectangle 10, 10, 236, 236
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse($bgRect)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, [System.Drawing.Color]::FromArgb(255, 4, 12, 20), [System.Drawing.Color]::FromArgb(255, 8, 45, 62), 45)
$g.FillPath($brush, $path)

# Cyan outer glow ring.
$pen1 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(230, 98, 232, 255)), 7
$g.DrawEllipse($pen1, $bgRect)
$pen2 = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 157, 125, 255)), 3
$g.DrawEllipse($pen2, 25, 25, 206, 206)

# Center orb.
$orbRect = New-Object System.Drawing.Rectangle 78, 54, 100, 100
$orbBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($orbRect, [System.Drawing.Color]::FromArgb(255, 110, 248, 255), [System.Drawing.Color]::FromArgb(255, 157, 125, 255), 90)
$g.FillEllipse($orbBrush, $orbRect)
$g.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 235, 255, 255)), 3), $orbRect)

# Workshop signal marks.
$wirePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(210, 215, 184, 106)), 5
$g.DrawLine($wirePen, 48, 160, 208, 160)
$g.DrawLine($wirePen, 62, 182, 194, 182)
$g.DrawLine($wirePen, 82, 204, 174, 204)

# Letters.
$font1 = New-Object System.Drawing.Font "Segoe UI Black", 44, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$font2 = New-Object System.Drawing.Font "Segoe UI Semibold", 18, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$txtBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 240, 252, 255))
$goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 215, 184, 106))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("TWIS", $font1, $txtBrush, (New-Object System.Drawing.RectangleF 0, 110, 256, 58), $sf)
$g.DrawString("HOLO", $font2, $goldBrush, (New-Object System.Drawing.RectangleF 0, 205, 256, 28), $sf)

# Export bitmap to PNG bytes, then wrap PNG in ICO container.
$pngStream = New-Object System.IO.MemoryStream
$bmp.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $pngStream.ToArray()
$pngStream.Dispose()
$g.Dispose()
$bmp.Dispose()

$outStream = New-Object System.IO.FileStream($OutPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
$writer = New-Object System.IO.BinaryWriter($outStream)

# ICO header: reserved=0, type=1, count=1
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)

# Directory entry: width 0 means 256, height 0 means 256, colors 0, reserved 0, planes 1, bitcount 32, bytes, offset 22
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)
$writer.Flush()
$writer.Close()
$outStream.Close()

Write-Host "Created icon: $OutPath"
