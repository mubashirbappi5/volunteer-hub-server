const express = require('express')
const cors = require('cors')

const app = express()
const port = process.env.PORT ||8000
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://volunteer-hub:nb3Uoob7Qhhh6Urx@cluster0.ig6ro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const volunteerdatabase = client.db("volunteerdb").collection("volunteerneedposts");
     

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection


    app.get('/posts',async(req,res)=>{
        const cursor = volunteerdatabase.find()
      const result = await cursor.toArray();
      res.send(result)
    })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/user',(req,res)=>{
    res.send("this is volunteer hub server")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})