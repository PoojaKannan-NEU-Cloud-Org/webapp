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
  default = "dev-imageterraform-testing"
}
variable "zone" {
  type    = string
  default = "us-west1-c"
}
source "googlecompute" "example" {
  project_id          = var.project_id
  zone                = var.zone
  image_name          = "cloud-serverless-function-{{timestamp}}"
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
      "sudo mv /tmp/webapp.zip /home/webapp",
      #Instlling the necessary config files
      "sudo yum update -y",
      "sudo yum install -y curl",
      "curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -",
      "sudo yum install -y nodejs",
      "node -v",
      "npm -v",
      # Installing Google ops agent 
      "curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh",
      "sudo bash add-google-cloud-ops-agent-repo.sh --also-install",
      # Creating the config.yaml for Google Cloud Ops Agent
      "sudo bash -c 'cat <<EOF > /etc/google-cloud-ops-agent/config.yaml",
      "logging:",
      "  receivers:",
      "    my-app-receiver:",
      "      type: files",
      "      include_paths:",
      "        - /var/log/csye6225/myapp.log",
      "      record_log_file_path: true",
      "  processors:",
      "    my-app-processor:",
      "      type: parse_json",
      "      time_key: time",
      "      time_format: \"%Y-%m-%dT%H:%M:%S.%L\"",
      "    move_severity:",
      "      type: modify_fields",
      "      fields:",
      "        severity:",
      "          move_from: jsonPayload.severity",
      "  service:",
      "    pipelines:",
      "      default_pipeline:",
      "        receivers: [my-app-receiver]",
      "        processors: [my-app-processor, move_severity]",
      "EOF'",


      "sudo systemctl enable google-cloud-ops-agent",
      "sudo systemctl start google-cloud-ops-agent",
      # Installing unzip package
      "sudo yum install -y unzip",
      # Unzipping and installing application dependencies
      "cd /home/webapp",
      "sudo unzip webapp.zip",
      # installing npm 
      "cd /home/webapp",
      "sudo npm install",
      # Giving permissions for the webapp folder
      "sudo chown -R csye6225:csye6225 /home/webapp",
      "sudo chmod 750 -R /home/webapp",
      # Giving permissions for the log file
      "sudo mkdir /var/log/csye6225",
      "sudo chown -R csye6225:csye6225 /var/log/csye6225",
      "sudo chmod 750 -R  /var/log/csye6225"
    ]
  }
}