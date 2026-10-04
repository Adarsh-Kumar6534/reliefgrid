# PowerShell script to build, tag, and publish ReliefGrid container images to container registry
param (
    [string]$REGISTRY = "ghcr.io/yourusername",
    [string]$TAG = "v1"
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  RELIEFGRID CONTAINER IMAGE PUBLISHER" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Target Registry : $REGISTRY" -ForegroundColor Yellow
Write-Host "Target Tag      : $TAG`n" -ForegroundColor Yellow

$BACKEND_IMAGE = "${REGISTRY}/reliefgrid-backend:${TAG}"
$FRONTEND_IMAGE = "${REGISTRY}/reliefgrid-frontend:${TAG}"

# 1. Build and tag Backend container image
Write-Host "[1/4] Building Backend container image..." -ForegroundColor Yellow
docker build -t $BACKEND_IMAGE ./backend
if ($LASTEXITCODE -ne 0) { exit 1 }

# 2. Build and tag Frontend container image
Write-Host "`n[2/4] Building Frontend container image..." -ForegroundColor Yellow
docker build -t $FRONTEND_IMAGE ./frontend
if ($LASTEXITCODE -ne 0) { exit 1 }

# 3. Push Backend image to registry
Write-Host "`n[3/4] Pushing Backend container image to $REGISTRY..." -ForegroundColor Yellow
docker push $BACKEND_IMAGE
if ($LASTEXITCODE -ne 0) { exit 1 }

# 4. Push Frontend image to registry
Write-Host "`n[4/4] Pushing Frontend container image to $REGISTRY..." -ForegroundColor Yellow
docker push $FRONTEND_IMAGE
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "  IMAGE PUBLISHING COMPLETE" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Backend Image  : $BACKEND_IMAGE" -ForegroundColor Green
Write-Host "Frontend Image : $FRONTEND_IMAGE" -ForegroundColor Green
