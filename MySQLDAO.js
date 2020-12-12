//This file is a DAO (Data access object) - We use it as an abstract interface for our DB
//Imports
const { reject } = require("bluebird");
const { promiseImpl } = require("ejs");
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

var getCountries = function () {
    //return a promise for this query so it can run asynchronously
    return new Promise((resolve, reject) => {
        //We use ? for value placeholders to prevent sql injection attacks.
        //The driver knows to scrub the values and put them into the ?s in order
        //putting these in an object is a just a neater equivilent of passing the two strings as seperate args 
        var queryObj = {
            sql: "select * from country;",
            values: ""
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

//Export functions
module.exports = { getCountries };