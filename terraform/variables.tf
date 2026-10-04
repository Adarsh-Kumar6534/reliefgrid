variable "aws_region" {
  description = "AWS region for infrastructure deployment."
  type        = string
  default     = "us-east-1"
}

# Configurable instance type allowing student developers to select Free Tier eligible or credit-backed instances.
variable "instance_type" {
  description = "EC2 instance type for the K3s single-node cluster."
  type        = string
  default     = "t3.small"
}

variable "key_pair_name" {
  description = "Name of an existing AWS SSH Key Pair for EC2 SSH access."
  type        = string
}

# Restrict SSH access to administrator's public IP range to prevent unauthorized access.
variable "admin_cidr" {
  description = "CIDR block allowed for SSH administrative access (e.g. '203.0.113.25/32')."
  type        = string
  default     = "0.0.0.0/0"

  validation {
    condition     = can(cidrnetmask(var.admin_cidr))
    error_message = "admin_cidr must be a valid IPv4 CIDR block (e.g., '1.2.3.4/32' or '0.0.0.0/0')."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the ReliefGrid VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "CIDR block for the public subnet."
  type        = string
  default     = "10.0.1.0/24"
}

variable "project_name" {
  description = "Project name tag."
  type        = string
  default     = "ReliefGrid"
}

variable "environment" {
  description = "Environment identifier (e.g., demo, dev, prod)."
  type        = string
  default     = "demo"
}

variable "k3s_version" {
  description = "K3s release version for cluster installation."
  type        = string
  default     = "v1.31.2+k3s1"
}

variable "frontend_image" {
  description = "Container image URI for ReliefGrid frontend."
  type        = string
  default     = "ghcr.io/reliefgrid/frontend:v1"
}

variable "backend_image" {
  description = "Container image URI for ReliefGrid backend."
  type        = string
  default     = "ghcr.io/reliefgrid/backend:v1"
}
