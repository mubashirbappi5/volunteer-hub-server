const express = require('express')
const cors = require('cors')

const app = express()
const port = process.env.PORT ||8000
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const BeVolunteerdatabase = client.db("BEvolunteerdb").collection("BeAvolunteer");
     

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

   
    app.post('/posts',async(req,res)=>{
        const newposts = req.body
        const result = await volunteerdatabase.insertOne(newposts)
        res.send(result)
    })
    app.get('/posts',async(req,res)=>{

      const { email, limit } = req.query; 
        let query = {};
        let cursor = volunteerdatabase.find(query)

        if (email) {
          query.organizer_email = email; 
        }

       

        if (limit) {
           
          cursor = volunteerdatabase.find(query).sort({ deadline: 1 }).limit(parseInt(limit)); 
        }

        const result = await cursor.toArray(); 
        res.send(result); 
    
    })
    
    app.get('/posts/:id',async(req,res)=>{
        const id = req.params.id
        const quary =  {_id: new ObjectId(id)}
        const result = await volunteerdatabase.findOne(quary)
        res.send(result)

    })
    app.delete('/posts/:id',async(req,res)=>{
      const id = req.params.id
      const quary = {_id: new ObjectId(id)}
      const result = await volunteerdatabase.deleteOne(quary)
      res.send(result)
    })
    app.put('/posts/:id',async(req,res)=>{
      const id = req.params.id
      const filter = {_id:new ObjectId(id)}
      const options = { upsert: true };
      const updatepost = req.body
      const updateposts ={
        $set:{
          title:updatepost.title,
          volunteers_needed:updatepost.volunteers_needed,
          deadline:updatepost.deadline,
          description:updatepost.deadline,
          category:updatepost.category,
          organizer_email:updatepost.organizer_email,
          organizer_name:updatepost.organizer_name,
          location:updatepost.location,
          thumbnail:updatepost.thumbnail,
          

        }
      }
      const result = await volunteerdatabase.updateOne(filter, updateposts, options)
      res.send(result)
    })
    app.post('/volunteer',async(req,res)=>{
      const volunteer = req.body
      const result = await  BeVolunteerdatabase.insertOne(volunteer)
      res.send(result)
  })
    app.get('/vounteer',async(req,res)=>{
      const cursor =BeVolunteerdatabase.find()
      const result = await cursor.toArray()
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