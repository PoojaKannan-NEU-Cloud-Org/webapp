packer {
  required_plugins {
    googlecompute = {
      source  = "github.com/hashicorp/googlecompute"
      version = ">= 1.0.0"
    }
  }
}

variable "project_id" {
  type    = string
  default = "devtesting-415014"
}

variable "zone" {
  type    = string
  default = "us-west1-c"
}

variable "db_host" {
  type    = string
  default = "localhost"
}

variable "db_user" {
  type    = string
  default = "root"
}

variable "db_pass" {
  type    = string
  default = "root"
}

variable "db_name" {
  type    = string
  default = "cloudcomputing"
}

source "googlecompute" "example" {
  project_id          = var.project_id
  zone                = var.zone
  image_name          = "centos8-node-mysql-{{timestamp}}"
  image_family        = "centos8-node-mysql"
  source_image_family = "centos-stream-8"
  ssh_username        = "centos"
  machine_type        = "e2-medium"
  disk_size           = 20
}

build {
  sources = ["source.googlecompute.example"]

  provisioner "file" {
    source      = "webapp.zip"
    destination = "/tmp/webapp.zip"
  }

  provisioner "shell" {
    inline = [
       # Creating the csye6225 group and user
      "sudo groupadd -r csye6225 || true",
      "sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225 || true",
      
       # Setting up the application directory and permissions
      "sudo mkdir -p /home/user",
      "sudo mv /tmp/webapp.zip /home/user/"
      "sudo chown -R csye6225:csye6225 /home/user/*",
      
      #Instlling the necessary config files
      "sudo yum update -y",
      "sudo yum install -y curl",
      "curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -",
      "sudo yum install -y nodejs",
      "node -v",
      "npm -v",
      "sudo yum install -y mysql-server",
      "sudo systemctl start mysqld",
      "sudo systemctl enable mysqld",
      "mysql --version",

     # Installing unzip package
    "sudo yum install -y unzip",
    
       # Unzipping and installing application dependencies
      "cd /home/user",
      "sudo unzip webapp.zip"
      "cd /home/user",
      "sudo npm install"

      "echo 'DB_HOST=${var.db_host}' > /home/user/.env",
      "echo 'DB_USER=${var.db_user}' >> //home/user/.env",
      "echo 'DB_PASSWORD=${var.db_pass}' >> //home/user/.env",
       "echo 'DB_NAME=${var.db_name}' >> //home/user/.env",
    ]
  }
}
