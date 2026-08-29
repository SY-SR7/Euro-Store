param()

$ErrorActionPreference = 'Stop'

function Get-EnvValue([string]$Path, [string]$Name) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match ('^' + [regex]::Escape($Name) + '\s*=') } | Select-Object -Last 1
  if (-not $line) { return $null }
  $value = ($line -split '=', 2)[1].Trim()
  if ($value) { return $value }
  return $null
}

function Set-EnvValue([string]$Path, [string]$Name, [string]$Value) {
  $content = if (Test-Path -LiteralPath $Path) { Get-Content -LiteralPath $Path -Raw } else { '' }
  $line = "$Name=$Value"
  if ($content -match ('(?m)^' + [regex]::Escape($Name) + '\s*=.*$')) {
    $content = [regex]::Replace($content, ('(?m)^' + [regex]::Escape($Name) + '\s*=.*$'), $line)
  } else {
    if ($content -and -not $content.EndsWith("`n")) { $content += "`r`n" }
    $content += "$line`r`n"
  }
  Set-Content -LiteralPath $Path -Value $content -NoNewline -Encoding utf8
}

function New-Secret {
  $bytes = [byte[]]::new(48)
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$rootPath = '.env.local'
$webPath = 'apps/web/.env.local'
$secret = (Get-EnvValue $rootPath 'NOTIFICATION_DISPATCH_SECRET')
if (-not $secret) { $secret = Get-EnvValue $webPath 'NOTIFICATION_DISPATCH_SECRET' }
if (-not $secret) { $secret = New-Secret }

foreach ($path in @($rootPath, $webPath)) {
  Set-EnvValue $path 'NOTIFICATION_DISPATCH_SECRET' $secret
  Set-EnvValue $path 'CRON_SECRET' $secret
}

Write-Output 'Configured NOTIFICATION_DISPATCH_SECRET and CRON_SECRET in root/web local environments (values hidden).'
