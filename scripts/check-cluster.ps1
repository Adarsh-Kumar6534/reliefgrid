# PowerShell script to verify Kubernetes cluster readiness and metrics server status
# Used for Stage 4 resilience and auto-scaling environment validation

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  RELIEFGRID STAGE 4 - CLUSTER ENVIRONMENT CHECK" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Check cluster connectivity
Write-Host "`n[1/4] Checking Kubernetes Cluster Context & Info..." -ForegroundColor Yellow
kubectl cluster-info
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Unable to connect to Kubernetes cluster. Ensure Minikube or Docker Desktop K8s is running." -ForegroundColor Red
    exit 1
}

# 2. Enable metrics server if running minikube
Write-Host "`n[2/4] Verifying / Enabling Metrics Server addon..." -ForegroundColor Yellow
minikube addons enable metrics-server 2>$null

# 3. Check node metrics
Write-Host "`n[3/4] Fetching Node CPU/Memory Metrics..." -ForegroundColor Yellow
kubectl top nodes

# 4. Check ReliefGrid namespace resources and HPA status
Write-Host "`n[4/4] Fetching ReliefGrid Pod Metrics & HPA Status..." -ForegroundColor Yellow
kubectl get pods -n reliefgrid
kubectl top pods -n reliefgrid 2>$null
kubectl get hpa -n reliefgrid 2>$null

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "  CLUSTER CHECK COMPLETE" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
