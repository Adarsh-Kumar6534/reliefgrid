# ReliefGrid AWS Deployment & Operations Guide

## Architectural Summary
ReliefGrid deploys to AWS using Infrastructure as Code (Terraform) provisioning a single-node K3s Kubernetes cluster on a dedicated `t3.small` EC2 instance inside a custom VPC.

---

## Prerequisites
1. **AWS CLI** authenticated (`aws sts get-caller-identity` returns valid IAM user/role).
2. **Terraform >= 1.5.0** installed.
3. **AWS Key Pair** created in your target AWS region (`us-east-1` default).

---

## Step-by-Step Deployment Procedure

### Step 1: Initialize & Validate Terraform
Navigate to the `terraform/` directory:

```powershell
cd terraform
terraform fmt
terraform init
terraform validate
```

### Step 2: Create Local `terraform.tfvars`
Create `terraform/terraform.tfvars` based on `terraform.tfvars.example`:

```hcl
aws_region     = "us-east-1"
instance_type  = "t3.small"
key_pair_name  = "your-aws-key-name"
admin_cidr     = "YOUR_PUBLIC_IP/32"  # Obtain via curl https://checkip.amazonaws.com
project_name   = "ReliefGrid"
environment    = "demo"
```

### Step 3: Review Execution Plan
```powershell
terraform plan
```
Verify that Terraform plans to create:
- 1 VPC
- 1 Public Subnet
- 1 Internet Gateway
- 1 Route Table & Association
- 1 Security Group
- 1 EC2 Instance (`t3.small`, 20GB gp3)

### Step 4: Provision Cloud Infrastructure
```powershell
terraform apply
```

---

## Step 5: Cluster Verification & K3s Status

1. **SSH Access**:
   ```powershell
   ssh -i /path/to/your-key.pem ubuntu@<EC2_PUBLIC_IP>
   ```

2. **Verify K3s System Readiness**:
   ```bash
   sudo kubectl get nodes
   sudo kubectl get pods -n reliefgrid
   ```

3. **Deploy ReliefGrid Manifests**:
   ```bash
   sudo kubectl apply -f k8s/
   # Apply AWS HPA capacity ceiling (maxReplicas: 3 for t3.small node safety)
   sudo kubectl apply -f k8s/08-backend-hpa-aws.yaml
   ```

4. **Verify Application Health**:
   ```bash
   curl http://localhost/health
   curl http://localhost/api/v1/resources
   ```

---

## Step 6: Post-Demo Cleanup
To destroy cloud resources when testing is complete:

```powershell
cd terraform
terraform destroy
```
