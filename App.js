let express = require("express");
let mongo = require("mongodb");
let cors = require("cors");
let dotenv = require("dotenv").config();
let bodyParser = require("body-parser");
let app = express();
//middleware that make express to read the data that is comming to sever in body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let mongoClint = mongo.MongoClient;
let port = process.env.PORT||9870;
let mongoLiveUrl = process.env.MongLiveUrl;
let db;

// checking
app.get("/",(req,res)=>{
 res.send("you are on server for testing")
})
// fetching data form location collection
app.get("/location", (req, res) => {
  db.collection("location")
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// getting data for mealtype
app.get("/mealtype", (req, res) => {
  db.collection("mealtype")
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// getting data for restaurant and filtering data on basis of condition
app.get("/restaurant", (req, res) => {
  let stateId = Number(req.query.StateId);
  let mealId = Number(req.query.MealId);
  let query = {};
  if (stateId && mealId) {
    query = { state_id: stateId, "mealTypes.mealtype_id": mealId };
  } else if (stateId) {
    query = { state_id: stateId };
  } else if (mealId) {
    query = { "mealTypes.mealtype_id": mealId };
  }
  db.collection("restaurants")
    .find(query)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// filter on the basis of mealid and cusine
app.get("/filter/:MealId", (req, res) => {
  let query = {};
  let sort = { cost: -1 }; //1 means assending sort and -1 mean dessending sort
  let mealId = Number(req.params.MealId);
  let cuisineId = Number(req.query.CuisineId);
  let hCost = Number(req.query.Hcost);
  let lCost = Number(req.query.Lcost);
  if (cuisineId && hCost && lCost) {
    query = {
      "mealTypes.mealtype_id": mealId,
      "cuisines.cuisine_id": cuisineId,
      $and: [{ cost: { $gt: lCost, $lt: hCost } }],
    };
  } else if (hCost && lCost) {
    query = {
      "mealTypes.mealtype_id": mealId,
      $and: [{ cost: { $gt: lCost, $lt: hCost } }],
    };
  } else if (cuisineId) {
    query = {
      "mealTypes.mealtype_id": mealId,
      "cuisines.cuisine_id": cuisineId,
    };
  } else {
    query = { "mealTypes.mealtype_id": mealId };
  }

  db.collection("restaurants")
    .find(query)
    .sort(sort)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//  Detail of the restaurant
app.get("/detail/:restaurantId", (req, res) => {
  let query = {};
  let restaurantId = Number(req.params.restaurantId);
  if (restaurantId) {
    query = { restaurant_id: restaurantId };
  }
  db.collection("restaurants")
    .find(query)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// get menu
app.get("/menu/:menuId", (req, res) => {
  let query = {};
  let menuId = Number(req.params.menuId);
  if (menuId) {
    query = { menu_id: menuId };
  }
  db.collection("menu")
    .find(query)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// get order
app.get("/orders", (req, res) => {
  let query = {};
  let email = req.query.Email;
  if (email) {
    // query={email:email}
    query = { email }; //distructing
  }
  db.collection("orders")
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// placing order
app.post("/placeOrder", (req, res) => {
  // console.log(req.body);
  db.collection("orders").insert(req.body, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// update orders
app.put("/updateOrder/:id", (req, res) => {
  let oid = Number(req.params.id);
  db.collection("orders").updateOne(
    { order_id: oid },
    {
      $set: {
        status: req.body.status,
        bank_name: req.body.bankName,
        date: req.body.date,
      },
    },(err,result)=>{
     if(err) throw err;
     res.send("order updated")
    }
  );
});
// delete order
app.delete("/deleteOrder/:id",(req,res)=>{
 let oid=mongo.ObjectId(req.params.id);
 db.collection('orders').remove({_id:oid},(err,result)=>{
  if(err) throw err;
  res.send("order deleted")
 })
})

// menu on the basis of selected id
app.post("/menuItem", (req, res) => {
  if (req.body) {
    db.collection("menu")
      .find({ menu_id: { $in: req.body } })
      .toArray((err, result) => {
        if (err) throw err;
        res.send(result);
      });
  } else {
    res.send("invalid input");
  }
});

// common way of calling the data by passing collection name form url
app.get("/items/:collectionName", (req, res) => {
  db.collection(req.params.collectionName)
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// connection with database
mongoClint.connect(mongoLiveUrl, (err, clint) => {
  if (err) throw console.log("error while connecting");
  db = clint.db("learnNode");
  // running the node js env.
  app.listen(port, (err) => {
    if (err) throw err;
    console.log(`express is running on port no: ${port}`);
  });
});
