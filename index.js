require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

//miderware

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Class is Running................");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zhrby.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const AssignmentCollection = client
      .db("AssignmentHub")
      .collection("assignment");
    const AssignmentApplicationCollection = client
      .db("AssignmentHub")
      .collection("assignment_Applicaton");

    app.get("/assignment", async (req, res) => {
      const curser = AssignmentCollection.find();
      const result = await curser.toArray();
      res.send(result);
    });

    app.post("/assignment", async (req, res) => {
      const newAssignment = req.body;
      const result = await AssignmentCollection.insertOne(newAssignment);
      console.log(result);
      res.send(result);
    });

    app.get("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AssignmentCollection.findOne(query);
      res.send(result);
    });

    app.delete("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AssignmentCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateAssignment = req.body;
      const Assignment = {
        $set: {
          title: updateAssignment.title,
          thumbnailUrl: updateAssignment.thumbnailUrl,
          marks: updateAssignment.marks,
          description: updateAssignment.description,
          difficulty: updateAssignment.difficulty,
          dueDate: updateAssignment.dueDate,
        },
      };
      const result = await AssignmentCollection.updateOne(
        query,
        Assignment,
        options
      );
      res.send(result);
    });

    app.get("/assignment-post", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { email: email };
      }
      const curser = AssignmentApplicationCollection.find(query);
      const result = await curser.toArray();
      res.send(result);
    });

    app.post("/assignment-post", async (req, res) => {
      const application = req.body;
      application.status = "pending";
      application.submittedAt = new Date();
      const result = await AssignmentApplicationCollection.insertOne(
        application
      );

      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`the job port is ${port}`);
});
