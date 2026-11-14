# Genera les icones PNG de l'aplicació amb el mateix dibuix que icons/icon.svg.
# Ús:  powershell -File eines/fes-icones.ps1
Add-Type -AssemblyName System.Drawing
$dir = Join-Path (Split-Path $PSScriptRoot -Parent) 'icons'

function Fes-Icona([int]$mida, [string]$nom, [bool]$arrodonit, [double]$escala) {
  $bmp = New-Object System.Drawing.Bitmap $mida, $mida
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)
  $k = $mida / 512.0
  $g.ScaleTransform($k, $k)
  $verd = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#2F6B3A'))
  $taronja = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#D9862B'))
  $crema = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#F3EEDF'))

  if ($arrodonit) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $r = 224
    $p.AddArc(0, 0, $r, $r, 180, 90); $p.AddArc(512 - $r, 0, $r, $r, 270, 90)
    $p.AddArc(512 - $r, 512 - $r, $r, $r, 0, 90); $p.AddArc(0, 512 - $r, $r, $r, 90, 90); $p.CloseFigure()
    $g.FillPath($verd, $p)
  } else { $g.FillRectangle($verd, 0, 0, 512, 512) }

  # El bolet, escalat al voltant del centre (les icones "maskable" necessiten marge)
  $g.TranslateTransform(256, 256); $g.ScaleTransform($escala, $escala); $g.TranslateTransform(-256, -256)
  $peu = [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 212, 280), (New-Object System.Drawing.PointF 300, 280), (New-Object System.Drawing.PointF 316, 390), (New-Object System.Drawing.PointF 196, 390))
  $g.FillPolygon($crema, $peu)
  $g.FillEllipse($crema, 196, 356, 120, 68)
  $g.FillPie($taronja, 96, 112, 320, 300, 180, 180)
  $bar = New-Object System.Drawing.Drawing2D.GraphicsPath
  $bar.AddArc(100, 246, 40, 40, 90, 180); $bar.AddArc(372, 246, 40, 40, 270, 180); $bar.CloseFigure()
  $g.FillPath($taronja, $bar)
  $g.FillEllipse($crema, 174, 174, 44, 44); $g.FillEllipse($crema, 270, 144, 32, 32); $g.FillEllipse($crema, 322, 202, 40, 40)

  $g.Dispose()
  $bmp.Save((Join-Path $dir $nom), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Fes-Icona 192 'icon-192.png' $true 1.0
Fes-Icona 512 'icon-512.png' $true 1.0
Fes-Icona 512 'icon-maskable-512.png' $false 0.72
Fes-Icona 180 'apple-touch-icon.png' $false 0.86
Fes-Icona 32 'favicon-32.png' $true 1.0
Get-ChildItem $dir | Select-Object Name, Length
