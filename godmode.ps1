$ErrorActionPreference='Continue'
$isWin=$IsWindows -or ($env:OS -like '*Windows*')
$proj=if($isWin){'C:\Users\asus\Desktop\progetto zak studio web'}else{"$HOME/Desktop/progetto zak studio web"}
Set-Location $proj

function Test-GodPrereqs {
  Write-Host 'GOD PRE-CHECKS...' -Fore Cyan
  @('node','npm','python3','git','claude') | ForEach-Object {
    if (-not (Get-Command $_ -ErrorAction SilentlyContinue)) { throw "MANCANTE: $_" }
    Write-Host "  $_ $((& $_ --version 2>$null | Select-Object -First 1))" -Fore Green
  }
  @('01-config\sender-profile.md','01-config\icp-definition.md','02-data\companies.csv','03-sequences\sequence-master.json','05-legal\legitimate-interest-assessment.md','07-assets\cal-link.md') | ForEach-Object {
    if (-not (Test-Path $_)) { throw "FILE CRITICO MANCANTE: $_" }
    Write-Host "  $_" -Fore Green
  }
  if (-not (Test-Path '07-assets\case-studies\*.pdf')) { Write-Host '  NESSUN CASE STUDY PDF' -Fore Yellow }
}

function Install-MCPGodMode {
  Write-Host 'INSTALLAZIONE MCP SERVER...' -Fore Cyan
  $mcps=@('@playwright/mcp@latest','firecrawl-mcp','@googleapis/mcp-sheets','netlify-cli','vercel','@composio/mcp','apify-cli')
  foreach ($pkg in $mcps) {
    Write-Host "  Installing $pkg..." -Fore Gray
    $result = npm install -g $pkg 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Host "  $pkg OK" -Fore Green }
    else { Write-Host "  $pkg SKIPPATO (fallito: $($result[-1]))" -Fore Yellow }
  }
  Write-Host '  Installing Playwright Chromium...' -Fore Gray
  playwright install chromium 2>$null | Out-Null
  Write-Host '  MCP INSTALLATI (controlla sopra eventuali skip)' -Fore Green
}

function Install-PythonDeps {
  Write-Host 'INSTALLAZIONE PYTHON DEPENDENCIES...' -Fore Cyan
  pip install schedule python-dotenv 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host '  Python deps OK' -Fore Green }
  else { Write-Host '  Python deps FALLITO (continua comunque)' -Fore Yellow }
}

function Setup-EnvGodMode {
  if (Test-Path '.env') { Write-Host '  .env esiste' -Fore Green; return }
  Write-Host 'INCOLLA 4 CHIAVI (browser si aprono)' -Fore Cyan
  Start-Process 'https://agentmail.to'; Start-Process 'https://firecrawl.dev'; Start-Process 'https://app.netlify.com/user/applications/personal'; Sleep 3
  $keys=@{}
  $keys.AGENTMAIL_API_KEY=Read-Host '  AGENTMAIL_API_KEY'
  $keys.FIRECRAWL_API_KEY=Read-Host '  FIRECRAWL_API_KEY'
  $keys.NETLIFY_AUTH_TOKEN=Read-Host '  NETLIFY_AUTH_TOKEN'
  $keys.AGENTMAIL_WEBHOOK_SECRET=Read-Host '  AGENTMAIL_WEBHOOK_SECRET (INVIO=auto)'
  if (-not $keys.AGENTMAIL_WEBHOOK_SECRET) { $keys.AGENTMAIL_WEBHOOK_SECRET=-join((1..32)|ForEach-Object{"{0:x2}" -f (Get-Random -Max 256)}) }
  @('VERCEL_TOKEN','APIFY_API_TOKEN','GOOGLE_SHEETS_CREDENTIALS','CALENDLY_USERNAME','ZEROBOUNCE_API_KEY','PAGESPEED_API_KEY','COMPOSIO_API_KEY') | ForEach-Object {
    $val=Read-Host "  $_ (opz)"; if ($val) { $keys[$_]=$val }
  }
  $keys.UNSUB_SECRET=-join((1..32)|ForEach-Object{"{0:x2}" -f (Get-Random -Max 256)})
  $keys.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" } | Set-Content -Encoding utf8 .env
  Write-Host '  .env CREATO' -Fore Green
}

function Register-MCPGodMode {
  Write-Host 'REGISTRAZIONE MCP IN CLAUDE CODE...' -Fore Cyan
  @('playwright -- npx @playwright/mcp@latest','firecrawl -- npx firecrawl-mcp','sheets -- npx @googleapis/mcp-sheets','netlify -- npx netlify-cli mcp','vercel -- npx vercel mcp','composio -- npx @composio/mcp','apify -- npx apify-cli mcp') | ForEach-Object { claude mcp add $_ 2>$null }
  Write-Host '  MCP REGISTRATI' -Fore Green
}

function Load-SkillsGodMode {
  Write-Host 'CARICAMENTO SKILL CUSTOM...' -Fore Cyan
  $skillsDir="$env:USERPROFILE\.claude\skills"
  @('lead-analyzer','web-demo-generator','copywriter-b2b','email-dispatcher') | ForEach-Object {
    $src="08-claude-code\custom-skills\$_"; $dst="$skillsDir\$_"
    if (-not (Test-Path $dst)) { Copy-Item $src $dst -Recurse -Force }
  }
  Write-Host '  IN CLAUDE CODE INCOLLA QUESTI 11 COMANDI /skill:' -Fore Yellow
  @('cold-email','email-sequence','gdpr-audit-prep','founder-marketing','copywriting','analytics-tracking','content-strategy','lead-analyzer','web-demo-generator','copywriter-b2b','email-dispatcher') | ForEach-Object { Write-Host "  /skill $_" -Fore Cyan }
}

function Start-PipelineGodMode {
  Write-Host "`n============================================================" -Fore Magenta
  Write-Host 'GOD MODE PIPELINE AVVIATO - NON TOCCARE NULLA' -Fore Magenta
  Write-Host "============================================================`n" -Fore Magenta
  python 08-claude-code\run-autonomous-pipeline.py full
  Write-Host "`nMODALITA DAILY CRON (08:00)..." -Fore Cyan
  while ($true) {
    $now=Get-Date; $next=($now.Date.AddDays(1)).AddHours(8); $wait=[math]::Max(1,($next-$now).TotalSeconds)
    Write-Host "  Prossimo: $next" -Fore Gray; Start-Sleep -Seconds $wait
    python 08-claude-code\run-autonomous-pipeline.py daily
  }
}

Test-GodPrereqs
Install-MCPGodMode
Install-PythonDeps
Setup-EnvGodMode
Register-MCPGodMode
Load-SkillsGodMode
Write-Host "`n============================================================" -Fore Green
Write-Host "  SETUP COMPLETO - CARICA 11 SKILL IN CLAUDE CODE" -Fore Green
Write-Host "  1. Nuovo terminale -> claude" -Fore Yellow
Write-Host "  2. Incolla 11 /skill (sopra)" -Fore Yellow
Write-Host "  3. Incolla master-prompt.md" -Fore Yellow
Write-Host "  4. Torna qui -> INVIO" -Fore Yellow
Write-Host "============================================================" -Fore Green
Read-Host "`nPremi INVIO quando pronto..."
Start-PipelineGodMode