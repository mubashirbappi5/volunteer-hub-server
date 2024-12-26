require('dotenv').config();
const express = require('express')
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');



const app = express()
const port = process.env.PORT ||8000

app.use(cookieParser());
app.use(cors({
  origin:['http://localhost:5175',
    'https://volunteer-hub-auth.web.app',
    'https://volunteer-hub-auth.firebaseapp.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials:true
}
))
app.use(express.json())

const verifyToken = (req,res,next)=>{
  const token = req.cookies?.token;
  console.log(token)
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
}
jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
  if (err) {
      return res.status(401).send({ message: 'unauthorized access' });
  }
  req.user = decoded;
  next();
})
  
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ig6ro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();
    // Send a ping to confirm a successful connection

   
    app.post('/posts', verifyToken,async(req,res)=>{
        const newposts = req.body
        if (req.user.email !== newposts.organizer_email) {
          return res.status(403).send({ message: 'forbidden access' });
        }
        const result = await volunteerdatabase.insertOne(newposts)
        res.send(result)
    })
    app.get('/posts', async(req,res)=>{

      const { email, limit } = req.query; 
       

        if (email) {
          return verifyToken(req, res, async () => {
          
            let query = { organizer_email: email };
            let cursor = volunteerdatabase.find(query);
            if (req.user.email !== req.query.email) {
              return res.status(403).send({ message: 'forbidden access' })
          }
      
            
      
            const result = await cursor.toArray(); 
            res.send(result); 
          });
        }
        let query = {};
        let cursor = volunteerdatabase.find(query);
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
    app.delete('/posts/:id',verifyToken,async(req,res)=>{
      const id = req.params.id
      const quary = {_id: new ObjectId(id)}
      const post = await volunteerdatabase.findOne(quary);
      if(post){
        if (req.user.email !== post.organizer_email) {
          return res.status(403).send({ message: 'forbidden access' });
        }
      }
      const result = await volunteerdatabase.deleteOne(quary)
      res.send(result)
    })
    app.put('/posts/:id',verifyToken,async(req,res)=>{
      const id = req.params.id
      const filter = {_id:new ObjectId(id)}
      const post = await volunteerdatabase.findOne(filter);
      if(post){
        if (req.user.email !== post.organizer_email) {
          return res.status(403).send({ message: 'forbidden access' });
        }
      }
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
    app.post('/volunteer',verifyToken,async(req,res)=>{
      const volunteer = req.body
      if (req.user.email !== volunteer.volunteer_email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const postId = volunteer.postId
      const result = await  BeVolunteerdatabase.insertOne(volunteer)
      const filter = { _id: new ObjectId(postId) };
      const update = { $inc: { volunteers_needed: -1 } };
      const updateneed = await volunteerdatabase.updateOne(filter, update);
      res.send(result)
  })
    app.get('/volunteer',verifyToken ,async(req,res)=>{
      const {email} = req.query
      const query ={ volunteer_email: email };
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: 'forbidden access' })
    }
      const cursor = BeVolunteerdatabase.find(query)
      const result = await cursor.toArray()
      res.send(result)
      
    })
    app.delete('/volunteer/:id',verifyToken,async(req,res)=>{
      const id = req.params.id
      
      const quary = {_id: new ObjectId(id)}
      const volunteer =  await BeVolunteerdatabase.findOne(quary )
      const postId = volunteer.postId
      if (req.user.email !== volunteer.volunteer_email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const filter = { _id: new ObjectId(postId) };
      const result = await BeVolunteerdatabase.deleteOne(quary)
      const update = { $inc: { volunteers_needed: +1 } };
      const updateneed = await volunteerdatabase.updateOne( filter, update);
      
     
      
      res.send(result)
    })

    //  Auth Api

   app.post('/jwt',async(req,res)=>{
    const user = req.body
    const token = jwt.sign(user, process.env.SECRET_KEY,{expiresIn:'10h'})
    res
     .cookie('token',token,{
      httpOnly:true,
      
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
     })
     .send({success: true})
   })
   app.post('/signout',async(req,res)=>{
    res.clearCookie('token',{
      httpOnly:true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
    })
    .send({success: true})
   })

    // await client.db("admin").command({ ping: 1 });
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