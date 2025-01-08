require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 5000;

//miderware

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://group-study-1e14a.web.app",
      "https://group-study-1e14a.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", async (req, res) => {
  res.send("Class is Running................");
});
const verifyTokeen = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.DB_SECURE, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
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
    // await client.connect();
    const AssignmentCollection = client
      .db("AssignmentHub")
      .collection("assignment");
    const AssignmentApplicationCollection = client
      .db("AssignmentHub")
      .collection("assignment_Applicaton");

    //auth Related Api

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.DB_SECURE, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.get("/assignment", async (req, res) => {
      const { serachParams } = req.query;
      let option = {};
      if (serachParams) {
        option = { title: { $regex: serachParams, $options: "i" } };
      }
      const curser = AssignmentCollection.find(option);
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

    app.get("/assignment-post", verifyTokeen, async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { email: email };
      }

      const result = await AssignmentApplicationCollection.find(
        query
      ).toArray();
      for (const application of result) {
        const query = { _id: new ObjectId(application.job_id) };
        const assignment = await AssignmentCollection.findOne(query);
        if (assignment) {
          application.title = assignment.title;
          application.marks = assignment.marks;
        }
      }
      res.send(result);
    });

    app.post("/assignment-post", async (req, res) => {
      const application = req.body;
      application.status = "pending";
      application.obtainMarks = "Not Given";
      application.feedback = "Not Given";
      application.submittedAt = new Date();
      const result = await AssignmentApplicationCollection.insertOne(
        application
      );

      res.send(result);
    });

    app.get("/assignment-get", async (req, res) => {
      const status = req.query.status;
      const query = status ? { status } : {};
      const result = await AssignmentApplicationCollection.find(
        query
      ).toArray();
      for (const application of result) {
        const query = { _id: new ObjectId(application.job_id) };
        const assignment = await AssignmentCollection.findOne(query);
        if (assignment) {
          application.title = assignment.title;
          application.marks = assignment.marks;
        }
      }
      res.send(result);
    });

    app.patch("/assignment-post/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: data.status,
          obtainMarks: data.obtainMarks,
          feedback: data.feedback,
        },
      };
      const result = await AssignmentApplicationCollection.updateOne(
        filter,
        updateDoc
      );
      console.log(result);

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
