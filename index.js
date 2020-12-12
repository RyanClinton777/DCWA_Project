//Imports
var express = require("express"); //back-end web app framework
var ejs = require("ejs"); //viewing/template engine, used to send views;

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

/*app.get("/ListCountries", (req, res) => {
    
});

app.get("/ListCities", (req, res) => {
    
});

app.get("/ListHeadsOfState", (req, res) => {
    
});
*/