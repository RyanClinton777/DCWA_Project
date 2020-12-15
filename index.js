//Imports
var express = require("express"); //back-end web app framework
var ejs = require("ejs"); //viewing/template engine, used to send views;
var mySQLDAO = require("./MySQLDAO.js"); //Import our MYSQL DAO
//body parser middle-ware, to parse and get the data from the body of a request.
var bodyParser = require("body-parser");

var app = express(); //handle used to access express methods

//Set view engine
app.set("view engine", "ejs");

//set bodyParser
//https://www.npmjs.com/package/body-parser#bodyparserurlencodedoptions
app.use(bodyParser.urlencoded({ extended: false }))

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
            //console.log(result);
            //Render our view, passing in the results into an array in that file.
            //We don't need to specify .ejs, it knows.
            res.render("showCountries", { countries: result });
        })
        .catch((error) => {
            res.send(error);
        });
});

//edit country form; takes co_code in as parameter in the url to make sure the country still exists, and to display the current values.
app.get("/edit/:id", (req, res) => {
    //pass in country code from URL ()
    mySQLDAO.getCountries(req.params.id)
        //if promise is resolved it sends back result
        .then((result) => {
            //Empty result sets won't be rejected/return error, so we check here.
            if (result.length > 0) {
                //render editCountry view, create a variable called country with the results of the query, which will be the data for the country of given id.
                //result is an array, even though there is necassarily only one result
                res.render("editCountry", { country: result[0] });
            }
            else {
                res.send("<h3>No such student with ID " + req.params.id + "</h3>");
            }
        })
        //ditto but rejection, and error
        .catch((error) => {
            res.send(error);
        });
});
``
//update country record. Takes data from the body of the request by using body-parser
app.post("/updateCountry", (req, res) => {
    console.log("UPDATE: " + req.body.code + ", " + req.body.name + ", " + req.body.details);

    //Update, pass in new details
    mySQLDAO.updateCountry(req.body.code, req.body.name, req.body.details)
        .then((result => {
            //redirect back to list page
            res.redirect("/ListCountries");
        }))
        .catch( (error) => {
            res.send(error);
        });
});

/*
app.get("/ListCities", (req, res) => {

});

app.get("/ListHeadsOfState", (req, res) => {

});
*/