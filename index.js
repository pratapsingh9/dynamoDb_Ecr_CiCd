const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand , TransactGetCommand } = require("@aws-sdk/lib-dynamodb");
const awsConfig = require("./cred.js"); // Import credentials

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

// -------------------- CREATE --------------------
app.post("/item", async (req, res) => {
    const { id, name, ...data } = req.body;
    try {
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: { id, name, ...data }
        });
        await ddbDocClient.send(command);
        res.json({ message: "Item added successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -------------------- READ --------------------
app.get("/item/:id/:name", async (req, res) => {
    const { id, name } = req.params;
    try {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: { id: Number(id), name }
        });
        const result = await ddbDocClient.send(command);
        res.json(result.Item || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -------------------- READ ALL --------------------
app.get("/items", async (req, res) => {
    try {
        const command = new ScanCommand({ TableName: TABLE_NAME });
        const result = await ddbDocClient.send(command);
        res.json(result.Items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -------------------- UPDATE --------------------
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

// -------------------- DELETE --------------------
app.delete("/item/:id/:name", async (req, res) => {
    const { id, name } = req.params;
    try {
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id: Number(id), name }
        });
        await ddbDocClient.send(command);
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -------------------- START SERVER --------------------
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
