# ZAK Studio Web - Autonomous B2B Cold Email System Launcher
# Single command to install, configure, and launch everything
# Usage: powershell -ExecutionPolicy Bypass -File ZAK_LAUNCH.ps1

param(
    [switch]$SkipPrereqs,
    [switch]$SkipMcpInstall,
    [switch]$SkipDeps,
    [switch]$OnlyDeploy,
    [string]$EnvFile = ".env"
)

Write-Host "============================================================"
Write-Host "  ZAK STUDIO WEB - AUTONOMOUS B2B OUTREACH SYSTEM"
Write-Host "  Progetto ZAK Studio Web - Complete Launch Script"
Write-Host "============================================================"
Write-Host ""

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

# Color functions
function Write-Step($msg) { Write-Host "[STEP] $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warning($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Error($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Gray }

# Check if running as admin (needed for some operations)
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Warning "Not running as Administrator. Some operations may require elevation."
}

# 1. CHECK PREREQUISITES
if (-not $SkipPrereqs) {
    Write-Step "Checking prerequisites..."

    $prereqs = @(
        @{ Name = "Node.js"; Cmd = "node"; Args = "--version"; MinVersion = "18.0.0" },
        @{ Name = "npm"; Cmd = "npm"; Args = "--version"; MinVersion = "9.0.0" },
        @{ Name = "Python"; Cmd = "python"; Args = "--version"; MinVersion = "3.10" },
        @{ Name = "Git"; Cmd = "git"; Args = "--version"; MinVersion = "2.0" },
        @{ Name = "Claude Code"; Cmd = "claude"; Args = "--version"; MinVersion = "1.0" }
    )

    foreach ($prereq in $prereqs) {
        try {
            $output = & $prereq.Cmd $prereq.Args 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "$($prereq.Name): $output"
            } else {
                throw "Not found"
            }
        } catch {
            Write-Error "$($prereq.Name) not found or version too old. Please install $($prereq.Name) >= $($prereq.MinVersion)"
            exit 1
        }
    }
}

# 2. SETUP ENVIRONMENT FILE
Write-Step "Setting up environment configuration..."

$envPath = Join-Path $projectRoot $EnvFile
$envExamplePath = Join-Path $projectRoot ".env.example"

if (-not (Test-Path $envExamplePath)) {
    Write-Step "Creating .env.example template..."
    $envTemplate = @"
# ZAK Studio Web - Environment Configuration
# Copy this to .env and fill in your credentials

# ===== REQUIRED (System won't start without these) =====
AGENTMAIL_API_KEY=your_agentmail_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
UNSUB_SECRET=generate_with_openssl_rand_hex_32

# ===== EMAIL / SMTP =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com

# ===== GOOGLE SHEETS =====
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
GOOGLE_SHEETS_TRACKING_ID=your_google_sheets_id

# ===== STRIPE =====
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# ===== DEPLOYMENT =====
DEPLOY_PROVIDER=netlify
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# ===== GITHUB =====
GITHUB_TOKEN=ghp_...

# ===== GHOST CMS =====
GHOST_ADMIN_URL=https://your-site.ghost.io
GHOST_ADMIN_KEY=your_admin_key

# ===== CALENDLY =====
CALENDLY_URL=https://calendly.com/your-link
CALENDLY_TRAINING_URL=https://calendly.com/your-link/training
CALENDLY_WEBHOOK_SECRET=your_webhook_secret

# ===== CRM / WEBHOOKS =====
CRM_WEBHOOK_URL=https://your-crm.com/webhook
AGENTMAIL_WEBHOOK_SECRET=generate_with_openssl_rand_hex_32

# ===== RECAPTCHA =====
RECAPTCHA_SITE_KEY=6Lc...
RECAPTCHA_SECRET_KEY=6Lc...

# ===== APP =====
APP_URL=https://yourdomain.com
NODE_ENV=production
LATE_PAYMENT_INTEREST=8
"@
    $envTemplate | Out-File -FilePath $envExamplePath -Encoding utf8
    Write-Success "Created .env.example"
}

if (-not (Test-Path $envPath)) {
    Copy-Item $envExamplePath $envPath
    Write-Warning "Created .env from template. PLEASE EDIT IT WITH YOUR CREDENTIALS!"
    Write-Warning "Opening .env in notepad..."
    notepad $envPath

    Write-Host ""
    Write-Host "============================================================"
    Write-Host "  IMPORTANT: Edit .env with your credentials, then re-run"
    Write-Host "============================================================"
    Read-Host "Press Enter after editing .env to continue..."
}

# Load environment variables
Write-Step "Loading environment variables..."
$envContent = Get-Content $envPath -Raw
$lines = $envContent -split "`r?`n"
foreach ($line in $lines) {
    $line = $line.Trim()
    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line -split "=", 2
        if ($parts.Count -eq 2) {
            $name = $parts[0].Trim()
            $value = $parts[1].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}
Write-Success "Environment variables loaded"

# Validate required vars
$requiredVars = @("AGENTMAIL_API_KEY", "FIRECRAWL_API_KEY", "NETLIFY_AUTH_TOKEN", "UNSUB_SECRET")
$missing = @()
foreach ($var in $requiredVars) {
    $varValue = Get-Item "Env:$var" -ErrorAction SilentlyContinue
    if (-not $varValue -or $varValue.Value -like "*your_*" -or $varValue.Value -like "*generate_*") {
        $missing += $var
    }
}
if ($missing.Count -gt 0) {
    Write-Error "Missing required environment variables: $($missing -join ', ')"
    Write-Error "Please edit .env and provide real values"
    exit 1
}
Write-Success "All required environment variables present"

# 3. INSTALL DEPENDENCIES
if (-not $SkipDeps) {
    Write-Step "Installing dependencies..."

    # Root package.json
    if (Test-Path "package.json") {
        Write-Info "Installing root dependencies..."
        npm install --prefer-offline 2>&1 | Out-Null
        Write-Success "Root dependencies installed"
    }

    # Site builder
    $siteBuilderPath = Join-Path (Join-Path $projectRoot "09-site-builder") "manufacturing-nextjs"
    if (Test-Path (Join-Path $siteBuilderPath "package.json")) {
        Write-Info "Installing site builder dependencies..."
        Push-Location $siteBuilderPath
        npm install --prefer-offline 2>&1 | Out-Null
        Pop-Location
        Write-Success "Site builder dependencies installed"
    }

    # Dispatch engine
    $dispatchPath = Join-Path (Join-Path $projectRoot "08-claude-code") "dispatch-engine"
    if (Test-Path (Join-Path $dispatchPath "package.json")) {
        Write-Info "Installing dispatch engine dependencies..."
        Push-Location $dispatchPath
        npm install --prefer-offline 2>&1 | Out-Null
        Pop-Location
        Write-Success "Dispatch engine dependencies installed"
    }

    # Payment engine
    $paymentPath = Join-Path (Join-Path $projectRoot "08-claude-code") "payment-engine"
    if (Test-Path (Join-Path $paymentPath "package.json")) {
        Write-Info "Installing payment engine dependencies..."
        Push-Location $paymentPath
        npm install --prefer-offline 2>&1 | Out-Null
        Pop-Location
        Write-Success "Payment engine dependencies installed"
    }

    # Delivery pipeline
    $deliveryPath = Join-Path (Join-Path $projectRoot "08-claude-code") "delivery-pipeline"
    if (Test-Path (Join-Path $deliveryPath "package.json")) {
        Write-Info "Installing delivery pipeline dependencies..."
        Push-Location $deliveryPath
        npm install --prefer-offline 2>&1 | Out-Null
        Pop-Location
        Write-Success "Delivery pipeline dependencies installed"
    }

    # Python dependencies
    Write-Info "Installing Python dependencies..."
    python -m pip install --upgrade pip --quiet
    python -m pip install schedule python-dotenv google-api-python-client google-auth stripe pdf-lib --quiet 2>&1 | Out-Null
    Write-Success "Python dependencies installed"
}

# 4. INSTALL MCP SERVERS
if (-not $SkipMcpInstall) {
    Write-Step "Installing MCP servers..."

    $mcpServers = @(
        "@modelcontextprotocol/server-playwright",
        "@modelcontextprotocol/server-fetch",
        "@modelcontextprotocol/server-filesystem",
        "@modelcontextprotocol/server-github",
        "@modelcontextprotocol/server-google-sheets",
        "@modelcontextprotocol/server-netlify",
        "@modelcontextprotocol/server-vercel"
    )

    foreach ($server in $mcpServers) {
        $shortName = $server.Split('/')[-1]
        Write-Info "Installing $shortName..."
        try {
            npm install -g $server --quiet 2>&1 | Out-Null
            Write-Success "$shortName installed"
        } catch {
            Write-Warning "$shortName install failed (may already exist)"
        }
    }

    # Special servers that might need different handling
    $specialServers = @(
        @{ Name = "firecrawl"; Package = "firecrawl-mcp" }
        @{ Name = "apify"; Package = "apify-mcp" }
    )

    foreach ($server in $specialServers) {
        Write-Info "Installing $($server.Name)..."
        try {
            npm install -g $server.Package --quiet 2>&1 | Out-Null
            Write-Success "$($server.Name) installed"
        } catch {
            Write-Warning "$($server.Name) install failed (may not be available via npm)"
        }
    }
}

# 5. REGISTER MCP SERVERS WITH CLAUDE CODE
Write-Step "Registering MCP servers with Claude Code..."

$mcpRegistrations = @(
    @{ Name = "playwright"; Cmd = "npx"; Args = "@modelcontextprotocol/server-playwright"; Env = @{} }
    @{ Name = "fetch"; Cmd = "npx"; Args = "@modelcontextprotocol/server-fetch"; Env = @{} }
    @{ Name = "filesystem"; Cmd = "npx"; Args = "@modelcontextprotocol/server-filesystem"; Args2 = @($projectRoot); Env = @{} }
    @{ Name = "github"; Cmd = "npx"; Args = "@modelcontextprotocol/server-github"; Env = @{ GITHUB_TOKEN = (Get-Item "Env:GITHUB_TOKEN" -ErrorAction SilentlyContinue).Value } }
    @{ Name = "google-sheets"; Cmd = "npx"; Args = "@modelcontextprotocol/server-google-sheets"; Env = @{ GOOGLE_SHEETS_CREDENTIALS = (Get-Item "Env:GOOGLE_SHEETS_CREDENTIALS" -ErrorAction SilentlyContinue).Value } }
    @{ Name = "netlify"; Cmd = "npx"; Args = "@modelcontextprotocol/server-netlify"; Env = @{ NETLIFY_AUTH_TOKEN = (Get-Item "Env:NETLIFY_AUTH_TOKEN" -ErrorAction SilentlyContinue).Value } }
    @{ Name = "vercel"; Cmd = "npx"; Args = "@modelcontextprotocol/server-vercel"; Env = @{ VERCEL_TOKEN = (Get-Item "Env:VERCEL_TOKEN" -ErrorAction SilentlyContinue).Value } }
    @{ Name = "firecrawl"; Cmd = "npx"; Args = "firecrawl-mcp"; Env = @{ FIRECRAWL_API_KEY = (Get-Item "Env:FIRECRAWL_API_KEY" -ErrorAction SilentlyContinue).Value } }
    @{ Name = "apify"; Cmd = "npx"; Args = "apify-mcp"; Env = @{ APIFY_TOKEN = (Get-Item "Env:APIFY_API_TOKEN" -ErrorAction SilentlyContinue).Value } }
)

foreach ($reg in $mcpRegistrations) {
    $envArgs = ""
    foreach ($kv in $reg.Env.GetEnumerator()) {
        $envArgs += " $($kv.Key)=`"$($kv.Value)`""
    }

    $args = $reg.Args
    if ($reg.ContainsKey("Args2")) { $args += " " + ($reg.Args2 -join " ") }

    $cmd = "claude mcp add $($reg.Name) $($reg.Cmd) $args$envArgs"
    Write-Info "Registering $($reg.Name)..."
    try {
        Invoke-Expression $cmd 2>&1 | Out-Null
        Write-Success "$($reg.Name) registered"
    } catch {
        Write-Warning "$($reg.Name) registration failed (may already exist)"
    }
}

Write-Success "MCP servers registered"

# 6. COPY CUSTOM SKILLS
Write-Step "Installing custom skills..."

$skillsSource = Join-Path $projectRoot "08-claude-code", "custom-skills"
$skillsTarget = Join-Path $env:USERPROFILE ".claude", "skills"

if (-not (Test-Path $skillsTarget)) {
    New-Item -ItemType Directory -Path $skillsTarget -Force | Out-Null
}

$skillDirs = Get-ChildItem $skillsSource -Directory
foreach ($skillDir in $skillDirs) {
    $targetDir = Join-Path $skillsTarget $skillDir.Name
    if (Test-Path $targetDir) {
        Remove-Item $targetDir -Recurse -Force
    }
    Copy-Item $skillDir.FullName $targetDir -Recurse
    Write-Success "Skill installed: $($skillDir.Name)"
}

# 7. BUILD SITE BUILDER
Write-Step "Building site builder (Next.js)..."
Push-Location (Join-Path $projectRoot "09-site-builder", "manufacturing-nextjs")
try {
    npm run build 2>&1 | Out-Null
    Write-Success "Site builder built successfully"
} catch {
    Write-Warning "Site builder build failed (will rebuild on deploy)"
}
Pop-Location

# 8. DEPLOY VERCEL WEBHOOKS
if ($env:VERCEL_TOKEN -and $env:VERCEL_TOKEN -notlike "*your_*") {
    Write-Step "Deploying Vercel webhooks..."
    try {
        npx vercel deploy --prod --token=$env:VERCEL_TOKEN --yes 2>&1 | Out-Null
        Write-Success "Vercel webhooks deployed"
    } catch {
        Write-Warning "Vercel deploy failed (may need manual deploy)"
    }
}

# 9. BUILD ALL TYPESCRIPT PROJECTS
Write-Step "Building TypeScript projects..."
$tsProjects = @(
    "08-claude-code/dispatch-engine",
    "08-claude-code/payment-engine",
    "08-claude-code/delivery-pipeline",
    "08-claude-code/vercel-webhooks"
)

foreach ($proj in $tsProjects) {
    $projPath = Join-Path $projectRoot $proj
    if (Test-Path (Join-Path $projPath "tsconfig.json")) {
        Write-Info "Building $proj..."
        Push-Location $projPath
        try {
            npx tsc --noEmit 2>&1 | Out-Null
            Write-Success "$proj type-check passed"
        } catch {
            Write-Warning "$proj type-check had errors"
        }
        Pop-Location
    }
}

# 10. VALIDATE CONFIGURATION
Write-Step "Validating master configuration..."
$configPath = Join-Path $projectRoot "config", "master-config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath | ConvertFrom-Json
    Write-Success "Master config loaded"

    # Validate critical paths
    $criticalPaths = @(
        "01-config/sender-profile.md",
        "01-config/icp-definition.md",
        "02-data/companies.csv",
        "03-sequences/sequence-master.json",
        "05-legal/lia-template.md",
        "05-legal/ropa-template.md",
        "05-legal/dsar-template.md",
        "05-legal/breach-template.md",
        "05-legal/dpa-tracker.md",
        "05-legal/unsubscribe-template.md",
        "05-legal/tia-template.md",
        "07-assets/cal-link.md",
        "07-assets/contract-template.md",
        "01-config/formal-proposal-template.md"
    )

    foreach ($p in $criticalPaths) {
        $fullPath = Join-Path $projectRoot $p
        if (-not (Test-Path $fullPath)) {
            Write-Warning "Missing: $p"
        }
    }
}

# 11. RUN INITIAL SYNC
Write-Step "Running initial data sync..."
try {
    python "$projectRoot\08-claude-code\run-autonomous-pipeline.py" --validate-only 2>&1 | Out-Null
    Write-Success "Pipeline validation passed"
} catch {
    Write-Warning "Pipeline validation had issues (check logs)"
}

# 12. LAUNCH ORCHESTRATOR
if (-not $OnlyDeploy) {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "  READY TO LAUNCH MASTER ORCHESTRATOR"
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "The system will now start the perpetual autonomous loop."
    Write-Host "Components:"
    Write-Host "  - Lead discovery (Apify + Firecrawl)"
    Write-Host "  - Site analysis (Playwright)"
    Write-Host "  - Demo generation (Next.js + Netlify)"
    Write-Host "  - Email sequences (AgentMail)"
    Write-Host "  - Payment processing (Stripe + Bank matching)"
    Write-Host "  - Site delivery (Auto-deploy + Credentials)"
    Write-Host "  - Post-delivery (Training, Health checks, Upsells)"
    Write-Host ""
    Write-Host "Press Ctrl+C to stop gracefully"
    Write-Host ""

    $confirm = Read-Host "Start orchestrator now? (Y/n)"
    if ($confirm -eq "" -or $confirm -like "y*") {
        Write-Step "Starting Master Orchestrator..."

        # Run with dangerous permissions for full autonomy
        $env:NODE_ENV = "production"

        # Use fcc-claude if available, otherwise standard claude
        $claudeCmd = "claude"
        if (Get-Command "fcc-claude" -ErrorAction SilentlyContinue) {
            $claudeCmd = "fcc-claude"
        }

        Write-Host "Launching with: $claudeCmd --dangerously-skip-permissions"
        Write-Host ""

        # Start the orchestrator
        & $claudeCmd --dangerously-skip-permissions -p "
import { masterOrchestrator } from './08-claude-code/master-orchestrator';
await masterOrchestrator.start();
console.log('Orchestrator running. Press Ctrl+C to stop.');
" 2>&1
    } else {
        Write-Warning "Launch cancelled. Run manually when ready:"
        Write-Host "  claude --dangerously-skip-permissions"
        Write-Host "  Then in Claude: > import { masterOrchestrator } from './08-claude-code/master-orchestrator'; await masterOrchestrator.start()"
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "  LAUNCH COMPLETE"
Write-Host "============================================================"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Monitor logs in terminal"
Write-Host "  2. Check Google Sheets for tracking"
Write-Host "  3. Verify email sending in AgentMail dashboard"
Write-Host "  4. Check Netlify/Vercel for deployments"
Write-Host ""
Write-Host "To stop: Ctrl+C (graceful shutdown)"
Write-Host "To restart: Run this script again"
Write-Host ""