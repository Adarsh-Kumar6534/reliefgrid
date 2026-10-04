#!/usr/bin/env bash
# Shell script to verify Kubernetes cluster readiness and metrics server status
set -e

echo "=================================================="
echo "  RELIEFGRID STAGE 4 - CLUSTER ENVIRONMENT CHECK"
echo "=================================================="

echo -e "\n[1/4] Checking Kubernetes Cluster Info..."
kubectl cluster-info

echo -e "\n[2/4] Enabling Metrics Server if running Minikube..."
minikube addons enable metrics-server 2>/dev/null || true

echo -e "\n[3/4] Fetching Node CPU/Memory Metrics..."
kubectl top nodes || echo "Metrics Server initializing..."

echo -e "\n[4/4] Fetching ReliefGrid Pod Metrics & HPA Status..."
kubectl get pods -n reliefgrid || true
kubectl top pods -n reliefgrid 2>/dev/null || echo "Pod metrics initializing..."
kubectl get hpa -n reliefgrid || true

echo "=================================================="
echo "  CLUSTER CHECK COMPLETE"
echo "=================================================="
