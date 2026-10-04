# RELIEFGRID Stage 5 AWS Deployment Guide

This guide provides step-by-step instructions for deploying ReliefGrid to **Amazon Web Services (AWS)** using **Terraform (Infrastructure as Code)** and **K3s (Lightweight Kubernetes)**.

---

## 1. Prerequisites

Ensure the following tools are installed on your workstation:
- **AWS CLI** (configured with valid AWS credentials)
- **Terraform** (`>= 1.5.0`)
- **Docker** (for building & pushing container images)
- **SSH Client** (for server node verification)
- **k6** (for remote synthetic load testing)

---

## 2. AWS Credential Verification

Run the AWS identity verification command before executing Terraform to ensure credentials are active:

```bash
# Purpose: Confirm that your local AWS CLI session is connected to your target AWS account
aws sts get-caller-identity
```

Expected Output:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/devops-admin"
}
```

---

## 3. SSH Key Pair Setup

1. Create an AWS SSH Key Pair in your target AWS region (e.g. `us-east-1`):
   ```bash
   # Purpose: Generate an AWS SSH Key Pair named 'reliefgrid-key'
   aws ec2 create-key-pair \
     --key-name reliefgrid-key \
     --query 'KeyMaterial' \
     --output text > reliefgrid-key.pem

   chmod 400 reliefgrid-key.pem
   ```

---

## 4. Terraform Provisioning

### Step 4.1: Initialize & Validate Terraform
```bash
cd terraform

# Purpose: Initialize Terraform modules and download AWS provider (~> 5.0)
terraform init

# Purpose: Check configuration formatting and syntax validity
terraform fmt
terraform validate
```

### Step 4.2: Configure Variables
```bash
# Purpose: Create custom variable configuration file
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region     = "us-east-1"
instance_type  = "t3.small"
key_pair_name  = "reliefgrid-key"
admin_cidr     = "YOUR_PUBLIC_IP/32" # Replace with your workstation IP from https://checkip.amazonaws.com
project_name   = "ReliefGrid"
environment    = "demo"
frontend_image = "ghcr.io/YOUR_GITHUB_USERNAME/reliefgrid-frontend:v1"
backend_image  = "ghcr.io/YOUR_GITHUB_USERNAME/reliefgrid-backend:v1"
```

### Step 4.3: Preview & Apply Infrastructure
```bash
# Purpose: Generate an execution plan displaying all resources to be created
terraform plan

# Purpose: Provision VPC, Subnet, IGW, Security Group, and K3s EC2 instance
terraform apply
```

Note the output values returned upon completion:
```
application_url = "http://54.210.120.45"
public_ip       = "54.210.120.45"
ssh_command     = "ssh -i reliefgrid-key.pem ubuntu@54.210.120.45"
```

---

## 5. K3s Node Verification

SSH into your newly provisioned EC2 instance:

```bash
# Purpose: Access the cloud server node
ssh -i reliefgrid-key.pem ubuntu@<PUBLIC_IP>

# Purpose: Confirm K3s single-node cluster is Ready
sudo kubectl get nodes
```

Expected Output:
```
NAME               STATUS   ROLES                  AGE     VERSION
ip-10-0-1-125      Ready    control-plane,master   2m10s   v1.31.2+k3s1
```

---

## 6. Publish Container Images to Registry

From your local machine, publish the container images:

```bash
# Purpose: Build and push production container images to GitHub Container Registry or Docker Hub
./scripts/publish-images.sh ghcr.io/YOUR_GITHUB_USERNAME v1
```

---

## 7. Deploy ReliefGrid Workload to AWS K3s

1. Update image tags in your Kubernetes manifests to match your pushed images.
2. Apply the manifests to the AWS K3s cluster:

```bash
# Apply Stage 4 manifests on the remote server
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.example.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-redis.yaml
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress.yaml
kubectl apply -f k8s/backend-hpa.yaml
```

3. Verify pods in AWS:
```bash
kubectl get pods -n reliefgrid -o wide
```

---

## 8. AWS Cloud HPA & Self-Healing Demonstrations

### Demonstration A: Public Application Access
Open `http://<PUBLIC_IP>` in your browser. Verify that the Disaster Telemetry Radar, Resource Registry, Emergency Needs, and Matching Center are online.

### Demonstration B: Cloud Auto-Scaling (HPA)
From your local workstation, target the AWS public IP:
```bash
BASE_URL=http://<PUBLIC_IP> k6 run load-test/crisis-load.js
```
On the EC2 node, watch HPA scale backend replicas from 2 to 8:
```bash
kubectl get hpa backend-hpa -n reliefgrid -w
```

### Demonstration C: Cloud Self-Healing
Delete a running backend pod:
```bash
kubectl delete pod <backend-pod-name> -n reliefgrid
```
Observe that K3s ReplicaSet immediately replaces the pod while traffic continues uninterrupted.

---

## 9. Cleanup & Infrastructure Teardown

To avoid incurring cloud charges after completing your presentation:

```bash
cd terraform
terraform destroy
```

Confirm in the AWS Console that the EC2 instance, Security Group, and VPC are destroyed.
