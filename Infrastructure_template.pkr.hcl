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
source "googlecompute" "example" {
  project_id          = var.project_id
  zone                = var.zone
  image_name          = "updatingpackerfile-{{timestamp}}"
  credentials_file    = "devtesting-415014-a693db63374f.json"
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
      "if [ ! -d /home/webapp ]; then sudo mkdir -p /home/webapp && echo 'Directory /home/webapp created successfully' || echo 'Failed to create directory /home/webapp'; else echo 'Directory /home/webapp already exists'; fi",

      # Creating a user and group
      "sudo groupadd -r csye6225",
      "sudo useradd -r -g csye6225 -s /usr/sbin/nologin csye6225",
      # Setting up the application directory and permissions
      "sudo mv /tmp/webbapp.zip /home/webapp",
      #Instlling the necessary config files
      "sudo yum update -y",
      "sudo yum install -y curl",
      "curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -",
      "sudo yum install -y nodejs",
      "node -v",
      "npm -v",
      # Installing unzip package
      "sudo yum install -y unzip",
      # Unzipping and installing application dependencies
      "cd /home/webapp",
      "sudo unzip webbapp.zip",
      # installing npm 
      "cd /home/webapp",
      "sudo npm install",
      # Giving permissions for the webapp folder
      "sudo chown -R csye6225:csye6225 /home/webapp",
      "sudo chmod 750 -R /home/webapp"
    ]
  }
}