Add-Type -AssemblyName System.Drawing

$scriptDir = $PSScriptRoot
$projectDir = (Get-Item $scriptDir).Parent.FullName
$pubDir = Join-Path $projectDir "public"
$newFaviconDir = Join-Path $projectDir "NEW FAVICON"

# Find source image
$srcFile = Get-ChildItem -Path $newFaviconDir -File | Where-Object { $_.Extension -match '\.(jpeg|jpg|png|webp)$' } | Select-Object -First 1
if (-not $srcFile) {
    Write-Error "No image file found in $newFaviconDir"
    exit 1
}

Write-Host "Using source image: $($srcFile.FullName)"

# Load source image into memory (avoid locking file)
$fileBytes = [System.IO.File]::ReadAllBytes($srcFile.FullName)
$memStream = New-Object System.IO.MemoryStream(,$fileBytes)
$srcImg = [System.Drawing.Image]::FromStream($memStream)

Write-Host "Source image loaded: $($srcImg.Width) x $($srcImg.Height)"

function Resize-Image($source, $width, $height, $targetPath) {
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $destImage = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($destImage)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $wrapMode = New-Object System.Drawing.Imaging.ImageAttributes
    $wrapMode.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $graphics.DrawImage($source, $destRect, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel, $wrapMode)
    
    $destImage.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $wrapMode.Dispose()
    $graphics.Dispose()
    $destImage.Dispose()
    Write-Host "Generated: $([System.IO.Path]::GetFileName($targetPath)) ($width x $height)"
}

# 1. Generate All Standard Required Favicon Sizes
$p16 = Join-Path $pubDir "favicon-16x16.png"
Resize-Image $srcImg 16 16 $p16

$p32 = Join-Path $pubDir "favicon-32x32.png"
Resize-Image $srcImg 32 32 $p32

$p48 = Join-Path $pubDir "favicon-48x48.png"
Resize-Image $srcImg 48 48 $p48

$p96 = Join-Path $pubDir "favicon-96x96.png"
Resize-Image $srcImg 96 96 $p96

$p180 = Join-Path $pubDir "apple-touch-icon.png"
Resize-Image $srcImg 180 180 $p180

$p192 = Join-Path $pubDir "favicon-192x192.png"
Resize-Image $srcImg 192 192 $p192
Copy-Item $p192 (Join-Path $pubDir "android-chrome-192x192.png") -Force
Copy-Item $p192 (Join-Path $pubDir "download.png") -Force

$p512 = Join-Path $pubDir "favicon-512x512.png"
Resize-Image $srcImg 512 512 $p512
Copy-Item $p512 (Join-Path $pubDir "android-chrome-512x512.png") -Force
Copy-Item $p512 (Join-Path $pubDir "logo.png") -Force

# 2. Multi-Resolution favicon.ico (16, 32, 48)
function Create-Ico($pngPaths, $icoPath) {
    $pngBytesList = @()
    foreach ($path in $pngPaths) {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $pngBytesList += ,$bytes
    }
    
    $stream = New-Object System.IO.MemoryStream
    $writer = New-Object System.IO.BinaryWriter($stream)
    
    # ICONDIR header
    $writer.Write([UInt16]0) # Reserved
    $writer.Write([UInt16]1) # Type: 1 = Icon
    $writer.Write([UInt16]$pngBytesList.Count) # Number of images
    
    # Calculate offset after directory entries: 6 + (16 * count)
    $offset = 6 + (16 * $pngBytesList.Count)
    
    for ($i = 0; $i -lt $pngBytesList.Count; $i++) {
        $bytes = $pngBytesList[$i]
        $img = [System.Drawing.Image]::FromFile($pngPaths[$i])
        $w = if ($img.Width -ge 256) { 0 } else { [byte]$img.Width }
        $h = if ($img.Height -ge 256) { 0 } else { [byte]$img.Height }
        $img.Dispose()
        
        $writer.Write([byte]$w)
        $writer.Write([byte]$h)
        $writer.Write([byte]0) # Color count
        $writer.Write([byte]0) # Reserved
        $writer.Write([UInt16]1) # Color planes
        $writer.Write([UInt16]32) # Bits per pixel
        $writer.Write([UInt32]$bytes.Length) # Image size in bytes
        $writer.Write([UInt32]$offset) # Offset
        
        $offset += $bytes.Length
    }
    
    # Write image data
    foreach ($bytes in $pngBytesList) {
        $writer.Write($bytes)
    }
    
    $writer.Flush()
    [System.IO.File]::WriteAllBytes($icoPath, $stream.ToArray())
    $writer.Dispose()
    $stream.Dispose()
    Write-Host "Generated: $([System.IO.Path]::GetFileName($icoPath)) (Multi-res 16, 32, 48)"
}

Create-Ico @($p16, $p32, $p48) (Join-Path $pubDir "favicon.ico")

# 3. Scalable SVG Favicon
$p512Bytes = [System.IO.File]::ReadAllBytes($p512)
$base64 = [Convert]::ToBase64String($p512Bytes)
$svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,$base64" width="512" height="512" />
</svg>
"@
[System.IO.File]::WriteAllText((Join-Path $pubDir "favicon.svg"), $svgContent, [System.Text.Encoding]::UTF8)
Write-Host "Generated: favicon.svg"

# 4. Remove Unnecessary / Redundant Favicon Files
$unnecessaryFiles = @(
    "favicon-16.png",
    "favicon-32.png",
    "favicon-48.png",
    "favicon-96.png",
    "favicon-128x128.png",
    "favicon-144x144.png",
    "favicon-192.png",
    "favicon-512.png",
    "icon-192.png",
    "icon-192x192.png",
    "icon-512.png",
    "icon-512x512.png",
    "favicon.png",
    "apple-touch-icon-precomposed.png"
)

foreach ($file in $unnecessaryFiles) {
    $filePath = Join-Path $pubDir $file
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
        Write-Host "Removed unnecessary file: $file"
    }
}

$srcImg.Dispose()
$memStream.Dispose()

Write-Host "All favicons successfully generated and unnecessary files removed!"
