#!/bin/bash
set -e

# Log user-data execution output for troubleshooting
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

echo "=================================================="
echo "  BOOTSTRAPPING RELIEFGRID K3S CLUSTER"
echo "=================================================="

# Update system package repositories
apt-get update -y
apt-get install -y --no-install-recommends curl ca-certificates open-iscsi nfs-common

# Install K3s single-node Kubernetes control plane
echo "Installing K3s version: ${k3s_version}..."
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="${k3s_version}" sh -s - \
  --write-kubeconfig-mode 644 \
  --disable servicelb

# Configure system-wide environment variables for kubectl access
cat <<'EOF' > /etc/profile.d/k3s.sh
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
alias k=kubectl
EOF
chmod +x /etc/profile.d/k3s.sh

# Wait for K3s node readiness
echo "Waiting for K3s node to report Ready status..."
until /usr/local/bin/kubectl get nodes | grep -q "Ready"; do
  sleep 5
done

# Create ReliefGrid application namespace
/usr/local/bin/kubectl create namespace reliefgrid || true

echo "=================================================="
echo "  K3S CLUSTER BOOTSTRAP COMPLETE"
echo "=================================================="
