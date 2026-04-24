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

### Live Demo

**Base URL**: http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com

This is a backend-only REST API (no frontend UI). You can test GET endpoints directly in a browser.

### REST API

The backend exposes the following REST API endpoints:

#### GET all images
`GET /images`  

Example:
```text
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com/images
```
#### Get a specific image
`GET /image/:assetid`

Example:
```text
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com/image/1001
```
You can get a valid asset id from `GET /images` 

#### Get labels of a specific image
`GET /image_labels/:assetid`

Example:
```text
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com/image_labels/1001
```

#### Get images with a label
`GET /images_with_label/:label`

Example:
```text
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com/images_with_label/mammal
```
- Only existing labels will return the corresponding data
- Non‑existent labels return an empty result with status 200 OK
- You can obtain valid labels from `GET /image_labels/:assetid`

#### Get all users
`GET /users`

Example:
```text
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com/users
```

#### Health check
`GET /ping`

Example:
```text
http://photoapp-web-service-env.eba-i39uydzy.us-east-2.elasticbeanstalk.com/ping
```

#### POST
- `/image/:userid` — Upload a new image  

#### DELETE
- `/images` — Delete images

#### Notes
The public examples above only include GET endpoints because they can be safely tested in a browser. 
POST and DELETE endpoints are listed for completeness, but example requests are intentionally omitted to avoid accidental data changes.

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
- M = number of images
- N = number of users

## System Design Summary

This system implements a multi-tier architecture by introducing a Node.js web service between clients and AWS services.

The web service acts as a centralized API layer that handles request processing, data coordination, and integration with S3, RDS, and Rekognition.

This design improves scalability, modularity, and separation of concerns compared to direct client-to-AWS interaction.

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


## Deployment (AWS Elastic Beanstalk)

The backend service is deployed on AWS Elastic Beanstalk.

Deployment is managed using the provided scripts:

- `create.ps1` — Create the Elastic Beanstalk environment
- `update.ps1` — Deploy updated application code
- `delete.ps1` — Terminate and clean up the environment

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
