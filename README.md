# PhotoApp (Multi-tier Cloud Application)

## Overview

This project is a cloud-based PhotoApp system that allows users to upload, store, retrieve, and analyze images.

The system integrates multiple AWS services:
- S3 for image storage
- RDS (MySQL) for metadata and user data
- Rekognition for image analysis

The application evolves from a **two-tier architecture (Python client + AWS services)** to a **multi-tier architecture with a Node.js web service deployed on AWS Elastic Beanstalk**.

This project was implemented and extended based on coursework, with a focus on system design, modular backend development, and cloud deployment.


## Architecture

### Multi-tier Design
```
Client
   ↓ HTTP
Node.js Web Service (Express, AWS EB)
   ↓
AWS Backend: 
  - S3 (Image Storage)
  - RDS (Metadata)
  - Rekognition (Image Analysis)
```
As described in the project specification, the system introduces a **web service layer** between the client and AWS services to improve scalability and separation of concerns.

## Tech Stack

- Node.js, Express
- AWS (S3, RDS, Rekognition, Elastic Beanstalk)
- MySQL

## Key Features

- Upload images to S3
- Store metadata in MySQL (RDS)
- Analyze images using AWS Rekognition
- Retrieve images and associated labels
- Multi-tier architecture using REST API
- Deployed on AWS Elastic Beanstalk


## Backend (Node.js Web Service)

The backend is implemented using:
- Node.js
- Express
- mysql2 (database access)
- AWS SDK (S3 + Rekognition)

### API Endpoints

Each endpoint is implemented in a separate module:


#### GET Endpoints
- **`api_get_images.js`** — `getImages()`  
- **`api_get_image.js`** — `getImage()`  
- **`api_get_image_labels.js`** — `getImageLabels()`  
- **`api_get_images_with_label.js`** — `getImagesWithLabel()`  
- **`api_get_ping.js`** — `getPing()`  
- **`api_get_users.js`** — `getUsers()`  

#### POST Endpoints
- **`api_post_image.js`** — `postImage()`  

#### DELETE Endpoints
- **`api_delete_images.js`** — `deleteImages()`  

#### Other Project Files
- **`app.js`** — Main Express application   
- **`helper.js`** — Utility functions  
- **`package.json`** — Project metadata  

This modular design improves maintainability and separation of concerns.

### Example API
```
GET /ping

Response:
{
  "M": 10,
  "N": 3
}
```
M = number of images, N = number of users

## Design Highlights

### 1. Multi-tier Architecture

The system transitions from:

- direct client → AWS interaction  
to:
- client → web service → AWS

Benefits:
- better scalability
- centralized logic
- easier security control


### 2. Resource Management Pattern

Each API function follows:
open connection → use resource → close connection


This ensures:
- efficient resource usage
- better reliability in distributed systems

This pattern is emphasized in the project design.


### 3. Fault Tolerance & Retry

- retry logic is implemented for database operations
- network failures are handled via structured error handling


### 4. Separation of Concerns

- API layer (Node.js)
- Data layer (MySQL)
- Storage layer (S3)
- AI layer (Rekognition)


## Deployment & Usage

The backend service is deployed on AWS Elastic Beanstalk.

### Deployment (AWS Elastic Beanstalk)

Deployment is managed using the provided scripts:

- `create.ps1` — Create the Elastic Beanstalk environment
- `update.ps1` — Deploy updated application code
- `delete.ps1` — Terminate and clean up the environment

### Usage

#### Live Demo

**Base URL**
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com

This is a backend-only REST API (no frontend UI). You can interact with it using a browser.

#### API Usage Examples

##### Get all images

```
GET /images
```

Example:

```
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com/images
```

##### Get a specific image

```
GET /image?id=<image_id>
```

##### Get image labels

```
GET /image-labels?id=<image_id>
```

##### Get images with a label

```
GET /images-with-label?label=<label>
```

##### Health check

```
GET /ping
```

Example:

```
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com/ping
```

##### Notes

* This is a public demo service with no authentication.
* Data may change or be reset at any time.
* Write operations (POST/DELETE) are not documented to prevent accidental data loss.



## Configuration

Configuration is managed via:

- **photoapp-config.ini** — Configuration file 
- **config.js** — Read configuration 

These files include:
- Database credentials  
- AWS credentials  
- Service endpoints  

## Notes

This project is based on coursework from Northwestern University (CS 310), and has been extended and refined for demonstration purposes.
