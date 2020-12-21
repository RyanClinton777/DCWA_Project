//---DAO to interface with mongodb---
const MongoClient = require('mongodb').MongoClient; //import mongoDB
const { promiseImpl } = require("ejs"); //Promise implementation - used to return promises

// Connection URL
const url = 'mongodb://localhost:27017';

// Database info
const dbName = 'headsOfStateDB';
const collName = "headsOfState";

//Handles for our db and collection, will be set when we connect to the mongo client
var headsOfStateDB;
var headsOfState; //collection

//Create a connection to the server through our MongoClient
//in mongodb versions 4 and onwards, must set useNewUrlParser and useUnifiedTopology options to true
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((client) => {
        //Create handles to the db and collection
        headsOfStateDB = client.db(dbName);
        headsOfState = headsOfStateDB.collection(collName);
    })
    .catch((error) => {
        console.log(error);
    });

//get all heads of state
var getHeadsOfState = function () {
    return new Promise((resolve, rejet) => {
        //Create a cursor object that contains the results of our query and gives us access to mongodb functions
        //we use find() with no args here to get all records from this collection
        var cursor = headsOfState.find();

        //We can move the cursor around in the result set, but here we just want to return the whole thing as an array. 
        cursor.toArray()
            .then((documents) => {
                resolve(documents);
            })
            .catch((error) => {
                reject(error);
            });
    })
}

module.exports = { getHeadsOfState };