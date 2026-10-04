# ReliefGrid AWS Cost Governance & Financial Safety Guide

## Overview & Financial Constraints
This document defines cost controls and operating strategies for deploying ReliefGrid on AWS.

- **Budget Boundary**: Maximum ~$100.00 account balance limit.
- **Safety Window**: Designed to run cleanly for up to 14 days.
- **Design Philosophy**: Single-node EC2 architecture avoiding paid managed services.

---

## 1. Created AWS Infrastructure & Cost Drivers

| AWS Resource | Purpose | Billing Model | 14-Day Estimated Cost |
|---|---|---|---|
| **EC2 `t3.small`** (1 Instance) | Single-node K3s Host | $0.0208 / hour (Free-Tier eligible) | ~$0.00 – $5.00 |
| **EBS gp3** (20 GB Root Volume) | Disk Storage | $0.08 / GB-month | ~$0.75 |
| **VPC & Internet Gateway** | Network Routing | FREE | $0.00 |
| **Security Group & Route Table** | Firewall Rules | FREE | $0.00 |
| **Public IPv4 Address** | EC2 Internet Access | $0.005 / hour | ~$1.68 |

### Explicitly Excluded Services (Cost Protection)
To prevent unexpected credit depletion, the following services are **PROHIBITED**:
- **AWS EKS / ECS**: Avoids $0.10/hr control plane charge (~$72/mo).
- **AWS RDS**: Avoids managed database fees ($15–$50/mo).
- **AWS ElastiCache**: Avoids managed Redis fees ($15–$30/mo).
- **NAT Gateway**: Avoids $0.045/hr + $0.045/GB data process fee (~$35/mo).
- **Application Load Balancer (ALB)**: Avoids $0.0225/hr + LCU charges (~$20/mo).

---

## 2. AWS Billing & Cost Monitoring Procedure

1. **Check Real-Time Cost**:
   - Log into AWS Management Console → **Billing and Cost Management** → **Cost Explorer**.
   - Set Granularity to **Daily** to inspect daily burn rate.

2. **Set Up Zero-Spend / Budget Alert**:
   - Navigate to **AWS Budgets** → **Create Budget**.
   - Set **Cost Budget** limit to **$30.00**.
   - Configure email notification when actual spend exceeds 80% ($24.00).

---

## 3. 14-Day Operating Strategy: Stopping vs. Destroying

### A. Pausing Infrastructure (Non-Demonstration Days)
When not actively presenting or testing, stop the EC2 instance to halt compute billing:

```powershell
# Stop EC2 instance via AWS CLI
aws ec2 stop-instances --instance-ids <YOUR_INSTANCE_ID>
```

- **Effect on Billing**:
  - EC2 Compute ($0.0832/hr): **PAUSED ($0.00/hr)**.
  - EBS Storage (20 GB): Continues at ~$0.05/day.
- **Resuming for Viva / Demonstration**:
  ```powershell
  # Start EC2 instance
  aws ec2 start-instances --instance-ids <YOUR_INSTANCE_ID>
  ```
  *(Note: Node IP may change upon restart. Update `admin_cidr` or SSH command if necessary.)*

### B. Complete Infrastructure Teardown (`terraform destroy`)
When the project assessment is finished, execute a total destruction:

```powershell
cd terraform
terraform destroy -auto-approve
```

- **Verification after Teardown**:
  - Run `aws ec2 describe-instances --filters "Name=instance-state-name,Values=running,pending"` to verify 0 active instances.
  - Run `aws ec2 describe-volumes` to confirm root volume was deleted.

---

## 4. Emergency Cost Cutoff
If AWS spend unexpectedly rises:
1. Immediately run `terraform destroy`.
2. Terminate any orphan EC2 instances via AWS Console.
