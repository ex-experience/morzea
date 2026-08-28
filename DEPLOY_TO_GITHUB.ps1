$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path "index.html")) { throw "index.html was not found." }
$remote = "https://github.com/ex-experience/morzea.git"
if (-not (Test-Path ".git")) { git init }
git branch -M main
$origin = git remote 2>$null | Select-String '^origin$'
if ($origin) { git remote set-url origin $remote } else { git remote add origin $remote }
git add .
if (git status --porcelain) { git commit -m "Launch MORZÉA V2 web preview" }
git push -u origin main
Write-Host "Now enable GitHub Pages: Settings → Pages → Deploy from a branch → main / (root)."
Write-Host "https://ex-experience.github.io/morzea/"
