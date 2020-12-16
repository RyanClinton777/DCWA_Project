//This file is a DAO (Data access object) - We use it as an abstract interface for our DB
//Imports
const { promiseImpl } = require("ejs"); //Promise implementation - used to return promises
var mysql = require("promise-mysql"); //A wrapper for the MySQLJS driver that allows us to use promises.

//https://www.npmjs.com/package/promise-mysql
//can use callbacks, but promises are more straightforward.

//promise mysql connection pool
//because promise-mysql works with promises, can't just assign this right away, have to do it in then() when creating pool
var pool;

//Connection pool
mysql.createPool({
    connectionLimit: 3,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'geography'
})
    .then((result) => {
        //Assign result to our pool if connection made successfuly
        pool = result;
    })
    .catch((error) => {
        console.log(error);
    });

//return country with given id, or all if id is undefined.
var getCountries = function (id) {

    var i = 1;
    var i = 1;
    //return a promise for this query so it can run asynchronously
    return new Promise((resolve, reject) => {
        //if no id, return all, else get that country of that id. Used for list page.
        myQuery = (id == undefined ? "select * from country" : "select * from country where co_code = ?;");

        //We use ? for value placeholders to prevent sql injection attacks.
        //The driver knows to scrub the values and put them into the ?s in order
        //putting these in an object is a just a neater equivilent of passing the two strings as seperate args 
        var queryObj = {
            sql: myQuery,
            values: [id]
        }

        pool.query(queryObj)
            .then((result) => {
                //query succesful, return resolve with data
                //Note: queries with no matching results are perfectly valid, will be resolved
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

//update country with given id, details
var updateCountry = function (id, name, details) {
    //return promise
    return new promiseImpl((resolve, reject) => {
        //compose query, using params 
        var queryObj = {
            sql: "UPDATE country SET co_name = ?, co_details = ? WHERE co_code = ?",
            values: [name, details, id]
        }

        //Attempt to perform query
        pool.query(queryObj)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

//delete country of given id
var deleteCountry = function(id) {
    //return promise
    return new promiseImpl((resolve, reject) => {
        //compose query, using params 
        var queryObj = {
            sql: "DELETE FROM country WHERE co_code = ?",
            values: [id]
        }

        //Attempt to perform query
        pool.query(queryObj)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

//Export functions
module.exports = { getCountries, updateCountry, deleteCountry};