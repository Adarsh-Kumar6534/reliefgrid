#!/usr/bin/env bash
# Shell script to build, tag, and publish ReliefGrid container images to container registry
set -e

REGISTRY="${1:-ghcr.io/yourusername}"
TAG="${2:-v1}"

BACKEND_IMAGE="${REGISTRY}/reliefgrid-backend:${TAG}"
FRONTEND_IMAGE="${REGISTRY}/reliefgrid-frontend:${TAG}"

echo "=================================================="
echo "  RELIEFGRID CONTAINER IMAGE PUBLISHER"
echo "=================================================="
echo "Target Registry : ${REGISTRY}"
echo "Target Tag      : ${TAG}"
echo ""

echo "[1/4] Building Backend container image..."
docker build -t "${BACKEND_IMAGE}" ./backend

echo "[2/4] Building Frontend container image..."
docker build -t "${FRONTEND_IMAGE}" ./frontend

echo "[3/4] Pushing Backend image to ${REGISTRY}..."
docker push "${BACKEND_IMAGE}"

echo "[4/4] Pushing Frontend image to ${REGISTRY}..."
docker push "${FRONTEND_IMAGE}"

echo "=================================================="
echo "  IMAGE PUBLISHING COMPLETE"
echo "=================================================="
echo "Backend Image  : ${BACKEND_IMAGE}"
echo "Frontend Image : ${FRONTEND_IMAGE}"
