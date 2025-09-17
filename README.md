# Node.js DynamoDB Docker CI/CD Project

Welcome to the **Node.js DynamoDB Docker CI/CD Project**! This project demonstrates how to build a REST API using **Node.js** and **Express**, connect it to **AWS DynamoDB**, containerize it using **Docker**, and deploy it to **EC2** using **GitHub Actions CI/CD**.

---

## CICD FLOW
<img width="1024" height="683" alt="image" src="https://github.com/user-attachments/assets/6ee3b0a5-8e95-4acd-a225-46f3bbe28caa" />



## Table of Contents

1. Project Overview
2. Technologies Used
3. Architecture Flow
4. Docker Setup
5. Node.js Application
6. DynamoDB Integration
7. CRUD Routes
8. CI/CD Pipeline
9. GitHub Actions Workflow
10. Environment Variables
11. Deployment Steps
12. Testing API
13. Security Best Practices
14. Project Flow Diagram
15. License

---

## Project Overview

This project is designed for beginners and intermediate developers to understand:

- How to create a Node.js REST API.  
- How to interact with AWS DynamoDB.  
- How to containerize applications using Docker.  
- How to automate deployment using GitHub Actions CI/CD.  
- How to deploy a Docker container on AWS EC2.  

By the end of this project, you will have a full-fledged pipeline from **code push → build → containerize → deploy**.

---

## Technologies Used

- Node.js 20 (Alpine for lightweight Docker images)  
- Express.js (REST API framework)  
- AWS SDK v3 (DynamoDB client)  
- Docker (Containerization)  
- GitHub Actions (CI/CD)  
- AWS EC2 (Deployment server)

---

## Architecture Flow

```text
+------------------+       +--------------------+       +----------------+
|  GitHub Repo     | --->  | GitHub Actions CI/CD | ---> | AWS EC2        |
+------------------+       +--------------------+       +----------------+
        |                             |                          |
        |                             |                          |
        v                             v                          v
   Source Code                  Docker Build                Docker Container
                               & Push Image to Docker Hub       Runs Node API
                                                                 |
                                                                 v
                                                          AWS DynamoDB
                                                          (CRUD operations)
```

---

## Docker Setup

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .

ENV AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
ENV AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
ENV AWS_REGION=ap-south-1

EXPOSE 3000
CMD ["node", "index.js"]
```

### Build and Run Docker Locally

```bash
# Build Docker image
docker build -t node-dynamodb-app .

# Run container
docker run -p 3000:3000 node-dynamodb-app
```

---

## Node.js Application

**index.js** is the main server file:

```javascript
const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const awsConfig = require("./creding.js");

const client = new DynamoDBClient({
    region: awsConfig.region,
    credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey
    }
});

const ddbDocClient = DynamoDBDocumentClient.from(client);
const app = express();
app.use(express.json());

const TABLE_NAME = "testing-docker";
```

---

## DynamoDB Integration

We use **AWS SDK v3** to interact with DynamoDB:

- **DynamoDBClient**: Connects to DynamoDB service.  
- **DynamoDBDocumentClient**: Converts JavaScript objects to DynamoDB format.  
- **Commands**: `PutCommand`, `GetCommand`, `ScanCommand`, `UpdateCommand`, `DeleteCommand` for CRUD operations.  

**creding.js Example**:

```javascript
module.exports = {
    accessKeyId: "YOUR_ACCESS_KEY",
    secretAccessKey: "YOUR_SECRET_KEY",
    region: "ap-south-1"
};
```

---

## CRUD Routes

### Create Item

```javascript
app.post("/item", async (req, res) => {
    const { id, name, ...data } = req.body;
    try {
        const command = new PutCommand({ TableName: TABLE_NAME, Item: { id, name, ...data } });
        await ddbDocClient.send(command);
        res.json({ message: "Item added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

---

### Read Item

```javascript
app.get("/item/:id/:name", async (req, res) => {
    const { id, name } = req.params;
    try {
        const command = new GetCommand({ TableName: TABLE_NAME, Key: { id: Number(id), name } });
        const result = await ddbDocClient.send(command);
        res.json(result.Item || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

---

### Read All Items

```javascript
app.get("/items", async (req, res) => {
    try {
        const command = new ScanCommand({ TableName: TABLE_NAME });
        const result = await ddbDocClient.send(command);
        res.json(result.Items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

---

### Update Item

```javascript
app.put("/item/:id/:name", async (req, res) => {
    const { id, name } = req.params;
    const updateData = req.body;

    try {
        let updateExp = "set ";
        const ExpressionAttributeValues = {};
        const ExpressionAttributeNames = {};
        Object.keys(updateData).forEach((key, i) => {
            updateExp += `#${key} = :${key}` + (i < Object.keys(updateData).length - 1 ? ", " : "");
            ExpressionAttributeValues[`:${key}`] = updateData[key];
            ExpressionAttributeNames[`#${key}`] = key;
        });

        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id: Number(id), name },
            UpdateExpression: updateExp,
            ExpressionAttributeValues,
            ExpressionAttributeNames,
            ReturnValues: "ALL_NEW"
        });

        const result = await ddbDocClient.send(command);
        res.json({ message: "Item updated", item: result.Attributes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

---

### Delete Item

```javascript
app.delete("/item/:id/:name", async (req, res) => {
    const { id, name } = req.params;
    try {
        const command = new DeleteCommand({ TableName: TABLE_NAME, Key: { id: Number(id), name } });
        await ddbDocClient.send(command);
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

---

## Start Server

```javascript
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## CI/CD Pipeline

- Triggered on `push` to `main` branch.  
- Steps include:
  1. Checkout code  
  2. Setup Docker Buildx  
  3. Login to Docker Hub  
  4. Build & push Docker image  
  5. SSH into EC2  
  6. Pull latest image & restart container

---

## GitHub Actions Workflow

```yaml
name: CI/CD Docker → EC2

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: pratap9/dynamodb_ecr_cicd:latest

      - name: Deploy on EC2
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            docker pull pratap9/dynamodb_ecr_cicd:latest
            if [ $(docker ps -q -f name=node-app) ]; then
              docker stop node-app
              docker rm node-app
            fi
            docker run -d --name node-app -p 3000:3000 pratap9/dynamodb_ecr_cicd:latest
            docker image prune -f
```

---

## Environment Variables

- AWS credentials should be stored securely.
- Recommended: use **GitHub Secrets** for CI/CD.  
- Local dev: store in `creding.js`.

---

## Deployment Steps

1. Push code to `main` branch.  
2. GitHub Actions builds and pushes Docker image.  
3. SSH deploy step pulls the image to EC2.  
4. Old container stops, new container runs.  
5. App is live on `http://EC2_IP:3000`.

---

## Testing API

Use **Postman** or **curl**:

```bash
# Create item
curl -X POST http://localhost:3000/item -H "Content-Type: application/json" -d '{"id":1,"name":"John"}'

# Get item
curl http://localhost:3000/item/1/John

# Update item
curl -X PUT http://localhost:3000/item/1/John -H "Content-Type: application/json" -d '{"age":25}'

# Delete item
curl -X DELETE http://localhost:3000/item/1/John
```

---

## Security Best Practices

- Never commit AWS keys to GitHub.  
- Use GitHub Secrets for CI/CD.  
- Limit EC2 inbound rules (only allow required ports).

---

## Project Flow Diagram

```text
[GitHub Repo] -> [GitHub Actions] -> [Docker Build & Push] -> [EC2 Deployment] -> [DynamoDB CRUD]
```

---

## License

MIT License © 2025



