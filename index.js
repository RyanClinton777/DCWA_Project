//Imports
var express = require("express"); //back-end web app framework
var ejs = require("ejs"); //viewing/template engine, used to send views;
var mySQLDAO = require("./MySQLDAO.js"); //Import our MYSQL DAO

var app = express(); //handle used to access express methods

//Set view engine
app.set("view engine", "ejs");

//listen on port 3007
app.listen(3007, () => {
    console.log("Listening on port 3007");
});

//Main page, contains links other pages
app.get("/", (req, res) => {
    res.render("index.ejs");
});

//Show all countries
app.get("/ListCountries", (req, res) => {
    //getStudents returns a promise, so we need to handle that here
    mySQLDAO.getCountries(req.params.id)
        .then((result) => {
            //Render our view, passing in the results into an array in that file.
            //We don't need to specify .ejs, it knows.
            res.render("showCountries", { countries: result });
        })
        .catch((error) => {
            res.send(error);
        });
});

/*
app.get("/ListCities", (req, res) => {

});

app.get("/ListHeadsOfState", (req, res) => {

});
*/