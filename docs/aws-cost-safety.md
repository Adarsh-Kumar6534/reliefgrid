# RELIEFGRID AWS Cost-Safety & Resource Management Guide

> [!WARNING]
> **AWS CHARGES & COST NOTICE**: Running `terraform apply` provisions real AWS cloud resources (EC2 instance, EBS volumes, public IPv4 addresses) that may incur financial charges depending on your AWS account age, credit status, and region. Always execute `terraform destroy` when your demonstration is complete.

---

## 1. Architectural Cost-Control Principles

ReliefGrid Stage 5 is engineered specifically for student/academic budget safety:

1. **Single-Node EC2 Architecture**: Replaces expensive managed control planes like Amazon EKS ($0.10/hour = ~$72/month) with a single-node K3s cluster on a single EC2 instance.
2. **No Managed Database Services**: Runs PostgreSQL and Redis inside K3s persistent volumes rather than Amazon RDS or ElastiCache.
3. **No NAT Gateways**: Uses a direct Internet Gateway in a public subnet, avoiding AWS NAT Gateway hourly charges (~$0.045/hour + data transfer).
4. **No Elastic Load Balancers**: Employs K3s built-in Ingress routing directly on the EC2 host.
5. **Configurable Instance Types**: Allows switching between `t3.micro`, `t3.small`, or `t2.micro` via `terraform.tfvars`.

---

## 2. Cost Factors to Monitor

- **EC2 Compute**: Charges apply per instance-hour based on selected `instance_type`.
- **EBS Storage**: A 20 GB gp3 root volume is provisioned (~$0.08/GB-month).
- **Public IPv4 Addressing**: AWS charges $0.005/hour for in-use public IPv4 addresses (~$3.60/month if left running).

---

## 3. Infrastructure Cleanup Procedure

To ensure no orphan resources remain in your AWS account after your demonstration:

```bash
# Navigate to the terraform directory
cd terraform

# Run Terraform Destroy to remove all provisioned infrastructure
terraform destroy
```

After execution, log into your [AWS Management Console](https://console.aws.amazon.com/) to confirm:
- [ ] EC2 instance `reliefgrid-k3s` is in `Terminated` state.
- [ ] VPC `ReliefGrid-vpc` is deleted.
- [ ] Security Group `ReliefGrid-security-group` is deleted.
