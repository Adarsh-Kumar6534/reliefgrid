# Security group enforcing strict boundary controls
resource "aws_security_group" "k3s_sg" {
  name        = "${var.project_name}-k3s-sg"
  description = "Security group for ReliefGrid K3s single-node deployment"
  vpc_id      = aws_vpc.main.id

  # Inbound SSH access restricted to admin CIDR
  ingress {
    description = "SSH administrative access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  # Inbound HTTP access for public user traffic to NGINX Ingress / Application UI
  ingress {
    description = "HTTP public application traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound HTTPS access
  ingress {
    description = "HTTPS public application traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound Traefik NodePort access for K3s public application traffic
  ingress {
    description = "Traefik NodePort public application access"
    from_port   = 31330
    to_port     = 31330
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Optional Kubernetes API access restricted to admin CIDR
  ingress {
    description = "Kubernetes API server access"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  # Allow full intra-security-group communication for container networking
  ingress {
    description = "Self internal container network traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  # Unrestricted egress allowing system updates and container image retrieval from registries
  egress {
    description = "Outbound internet access"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-security-group"
  }
}
