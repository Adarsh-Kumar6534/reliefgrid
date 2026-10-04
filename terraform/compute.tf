# Dynamically query current official Ubuntu 24.04 LTS AMI for the target region
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical official AWS owner ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Provision EC2 instance acting as K3s single-node host
resource "aws_instance" "k3s_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.k3s_sg.id]
  key_name                    = var.key_pair_name
  associate_public_ip_address = true

  # Attach 20GB root volume for container image storage and persistent storage
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    k3s_version = var.k3s_version
  })

  tags = {
    Name = "${var.project_name}-k3s"
  }

  # Ensure network components exist prior to EC2 provisioning
  depends_on = [
    aws_internet_gateway.gw,
    aws_route_table_association.public
  ]
}
