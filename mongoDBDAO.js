//---DAO to interface with mongodb---
const MongoClient = require('mongodb').MongoClient; //import mongoDB
const { promiseImpl } = require("ejs"); //Promise implementation - used to return promises

// Connection URL
const url = 'mongodb://localhost:27017';

// Database info
const dbName = 'headsOfStateDB';
const collName = "headsOfState";

//Handles for our db and collection, will be set when we connect to the mongo client
var headsOfStateDB; //DB connection object
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
    return new Promise((resolve, reject) => {
        //If connection fails, reject with error message (will be treated like a normal error).
        //DB connection object will still be undefined if the connection failed
        //Note: I only just found out about template literals, in case you are suspicious of them only showing up in some of the code
        if (headsOfStateDB == undefined) reject("Connection to ${url} failed.");

        //Create a cursor object that contains the results of our query and gives us access to mongodb functions
        //we use find() with no args here to get all records from this collection
        var cursor = headsOfState.find()

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

//EXTRA 2: get head of state for given country code
//Used for the extra function of showing an error if the user tries to add a head for a country that already has one (_id already taken)
//Case sensitive, but only upper case IDs should be entered into the db anyway
var getHeadOfState = function (country) {
    return new Promise((resolve, reject) => {
        //If connection fails, reject with error message (will be treated like a normal error).
        //DB connection object will still be undefined if the connection failed
        if (headsOfStateDB == undefined) reject("Connection to ${url} failed.");

        var cursor = headsOfState.findOne({ _id: country })
            .then((document) => {
                resolve(document);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

//add head of state with given details
var addHeadOfState = function (co_code, headOfState) {
    return new Promise((resolve, reject) => {
        //If connection fails, reject with error message (will be treated like a normal error).
        //DB connection object will still be undefined if the connection failed
        if (headsOfStateDB == undefined) reject("Connection to ${url} failed.");

        //insert record - _id here is the country code the head belongs to.
        headsOfState.insertOne({ "_id": co_code, "headOfState": headOfState })
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

module.exports = { getHeadsOfState, addHeadOfState, getHeadOfState };