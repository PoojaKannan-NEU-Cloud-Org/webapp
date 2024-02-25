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
  default = "Reset@123"
}

variable "db_name" {
  type    = string
  default = "cloud_computing"
}

source "googlecompute" "example" {
  project_id          = var.project_i
  zone                = var.zone
  image_name          = "customimagecloud-{{timestamp}}"
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

  provisioner "file" {
    source      = "application.service"
    destination = "/tmp/application.service"
  }

  provisioner "shell" {
    inline = [

      # Creating the csye6225 group and user
      "if [ ! -d /home/user ]; then sudo mkdir -p /home/user && echo 'Directory /home/user created successfully' || echo 'Failed to create directory /home/user'; else echo 'Directory /home/user already exists'; fi",

      "sudo groupadd -r csye6225",
      "sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225",
      "sudo chown -R csye6225:csye6225 /home/user/",
      
      # Setting up the application directory and permissions
      "sudo mv /tmp/webapp.zip /home/user/",

      #Instlling the necessary config files
      "sudo yum update -y",
      "sudo yum install -y curl",
      "curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -",
      "sudo yum install -y nodejs",
      "node -v",
      "npm -v",
      "sudo yum install -y mysql-server",
      "sudo systemctl start mysqld",
      "sudo systemctl enable mysqld",
      "mysql --version",
      "sudo mysql -u root <<'EOF'",
        "ALTER USER 'root'@'localhost' IDENTIFIED BY '${var.db_pass}';",
        "CREATE DATABASE `${var.db_name}`;",
        "exit",
        "EOF",
      
      
      # Installing unzip package
      "sudo yum install -y unzip",

      # Unzipping and installing application dependencies
      "cd /home/user",
      "sudo unzip webapp.zip",

      # Assuming package.json is directly inside the unzipped content
      "cd /home/user/",
      "sudo npm install",

      # Assuming package.json is directly inside the unzipped content
      "echo 'DB_HOST=${var.db_host}' | sudo tee /home/user/.env > /dev/null",
      "echo 'DB_USER=${var.db_user}' | sudo tee -a /home/user/.env > /dev/null",
      "echo 'DB_PASSWORD=${var.db_pass}' | sudo tee -a /home/user/.env > /dev/null",
      "echo 'DB_NAME=${var.db_name}' | sudo tee -a /home/user/.env > /dev/null",

      #Systemd commands to start the web application

      "sudo mv /tmp/application.service /etc/systemd/system/",
      "sudo systemctl daemon-reload",
      "sudo systemctl enable application.service",
      "sudo systemctl start application.service",
      "sudo systemctl status application.service",
      
    ]
  }
}
