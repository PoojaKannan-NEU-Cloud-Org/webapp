# Web Application Deployment with Git Actions, Packer, and Terraform

This repository contains the source code and deployment configurations for deploying a web application on Google Cloud Platform (GCP) using Git Actions, Packer, and Terraform.

## Assignments Overview

### Assignment_01: Health Check Endpoint
- Created a web application with an endpoint at http://localhost:8080/healthz to check the health status of the database server.

### Assignment_02: Additional Endpoints and Methods
- Enhanced the web application to include a second endpoint at http://localhost:8080/v1 supporting methods such as POST, GET, and PUT.

### Assignment_03: Integration Testing with Git Actions
- Integrated Git Actions for automated integration testing of the web application.

### Assignment_04: Custom Image Creation with Packer and Terraform
- Developed a custom image using Packer with all dependencies required for the web application.
- Utilized Terraform to create VM instances on GCP and configured a systemd service file named `application.service` to start the web application. The service hits both endpoints defined in Assignment_02.

### Assignment_05: Cloud SQL Integration
- Updated the Packer custom image to include connections to a Cloud SQL instance for the web application.
- Leveraged Terraform to create VM instances on GCP, integrating a startup script to launch the web application.

## Directory Structure

- `/app`: Contains the source code of the web application.
- `/packer`: Includes Packer configuration files for building custom images.
- `/terraform`: Contains Terraform configurations for provisioning VM instances on GCP and associated resources.(seperate repo)
- `/tests`: Includes integration tests for the web application.



