output "instance_id" {
  description = "EC2 Instance ID."
  value       = aws_instance.k3s_server.id
}

output "public_ip" {
  description = "Public IPv4 address of the ReliefGrid K3s server."
  value       = aws_instance.k3s_server.public_ip
}

output "public_dns" {
  description = "Public DNS hostname of the EC2 instance."
  value       = aws_instance.k3s_server.public_dns
}

output "security_group_id" {
  description = "Security Group ID."
  value       = aws_security_group.k3s_sg.id
}

output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.main.id
}

output "subnet_id" {
  description = "Public Subnet ID."
  value       = aws_subnet.public.id
}

output "application_url" {
  description = "Public URL to access ReliefGrid web interface."
  value       = "http://${aws_instance.k3s_server.public_ip}"
}

output "ssh_command" {
  description = "SSH command to access the K3s server node."
  value       = "ssh -i <your-key.pem> ubuntu@${aws_instance.k3s_server.public_ip}"
}
