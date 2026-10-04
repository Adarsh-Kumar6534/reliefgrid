# ReliefGrid Infrastructure as Code (Terraform)

This directory contains Terraform manifests to provision a single-node K3s Kubernetes host on AWS EC2.

---

## 📋 Infrastructure Components

- **VPC & Subnet**: Dedicated VPC (`10.0.0.0/16`) with 1 Public Subnet (`10.0.1.0/24`).
- **Internet Gateway**: Public internet routing without expensive NAT Gateways.
- **Security Group**:
  - Inbound SSH (22) & Kubernetes API (6443) restricted to `admin_cidr`.
  - Inbound HTTP (80) & HTTPS (443) open for web traffic.
  - Internal database ports (PostgreSQL 5432, Redis 6379) **blocked** from public access.
- **EC2 Instance**: Ubuntu 24.04 LTS host (`reliefgrid-k3s`) running single-node K3s.
- **User-Data Bootstrapping**: Automated OS updates, K3s installation (`v1.31.2+k3s1`), and namespace creation (`reliefgrid`).

---

## 🚀 Execution Workflow

```bash
# 1. Initialize Terraform plugins
terraform init

# 2. Format and validate configuration files
terraform fmt
terraform validate

# 3. Create your custom variable file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your key_pair_name and admin_cidr

# 4. Preview infrastructure changes
terraform plan

# 5. Apply infrastructure provisioning (Requires manual user confirmation)
terraform apply
```

---

## 🧹 Destroy Infrastructure

```bash
# Tear down all AWS resources when demonstration is complete to avoid charges
terraform destroy
```
