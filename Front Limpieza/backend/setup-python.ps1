$ErrorActionPreference = "Stop"

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvDir = Join-Path $backendDir ".venv"
$pythonCandidates = @(
  "C:\Users\Pep Biel\AppData\Local\Programs\Python\Python312\python.exe",
  "C:\Users\Pep Biel\AppData\Local\Programs\Python\Python313\python.exe"
)

$pythonExe = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $pythonExe) {
  throw "No se encontro una instalacion de Python valida."
}

if (-not (Test-Path -LiteralPath $venvDir)) {
  & $pythonExe -m venv $venvDir
}

$venvPython = Join-Path $venvDir "Scripts\python.exe"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $backendDir "requirements.txt")

Write-Output "Backend Python listo en $venvPython"
