//Imports
var express = require("express"); //back-end web app framework
var ejs = require("ejs"); //viewing/template engine, used to send views;
var mySQLDAO = require("./MySQLDAO.js"); //Import our MYSQL DAO
var mongoDBDAO = require("./mongoDBDAO.js"); //Import MongoDB DAO
//body parser middle-ware, to parse and get the data from the body of a request.
var bodyParser = require("body-parser");
//express validator middleware, used to validate inputs
//check is used to check data against constraints
//validationResult to show if any errors found when checking
//We can then use EJS to display messages for these errors on the screen, e.g. tell user that name field must have a value etc.
const { check, validationResult } = require('express-validator');

var app = express(); //handle used to access express methods

/*
TODO: 
    list heads of state
    add head of state
    add home button to every page (including error displays?)
    show detailed message if connection refused at any point? (currently only in list pages)

EXTRAS:
    display cities for a country?
    update country?
*/

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
            //Render our view, passing in the results into an array in that file.
            //We don't need to specify .ejs, it knows.
            res.render("listCountries", { countries: result });
        })
        .catch((error) => {
            //Show appropriate error message if database connection fails
            if (error.code = "ECONNREFUSED") res.send("<h1>ERROR: Connection(" + error.syscall + ") to " + error.address + ":" + error.port + " refused. Database may be offline.</h1>");

            //else just send the error info
            else res.send(error);
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
                res.render("editCountry", { errors: undefined, country: result[0] });
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

//update country record. Takes data from the body of the request by using body-parser
//We use express-validator middleware to validate the inputs
//name must have a value. ID too but it can't be changed so there no need to check it here.
app.post("/edit",
    [check("name").isLength({ min: 1 }).withMessage("Please enter a name")],
    (req, res) => {
        //if any errors found in validation chain
        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            //render the page again, but this time we pass in our errors so their messages will be displayed to the user
            //We pass in the current values as well, so we can keep the ones that were already entered, so the user doesn't lose their work
            details = { co_code: req.body.code, co_name: req.body.name, co_details: req.body.details };
            console.log(details);
            res.render("editCountry", { errors: errors.errors, country: details });
        }
        //else inputs are valid, proceed as normal
        else {
            console.log("UPDATE: " + req.body.code + ", " + req.body.name + ", " + req.body.details);//DEBUG

            //Update, pass in new details
            mySQLDAO.updateCountry(req.body.code, req.body.name, req.body.details)
                .then((result => {
                    //redirect back to list page
                    res.redirect("/ListCountries");
                }))
                .catch((error) => {
                    res.send(error);
                });
        }
    });

//Delete the country with the given ID. Even though we are deleting something, the delete method is not appropriate here as you can't call it from a button or hyperlink
app.get("/delete/:id", (req, res) => {
    mySQLDAO.deleteCountry(req.params.id)
        .then((result => {
            //use "affectedRows" attribute of query result to check if it didn't exist
            if (result.affectedRows == 0) {
                res.send("<h3>College with ID " + req.params.collegeID + " does not exist.</h3>");
            }
            //redirect back to list page, user will be able to see that the record has been deleted.
            else res.redirect("/ListCountries");
        }))
        .catch((error) => {
            //Show specific message if it cna't be deleted due to foreign key constraints
            if (error.code == "ER_ROW_IS_REFERENCED_2") {
                res.send("<h3>Cannot delete country with code: [" + req.params.id + "], it has cities.</h3>");
            }
            //else just print the message
            else res.send(error.sqlMessage);
        })
});

//show form for adding a country to the mysql db
app.get("/AddCountry", (req, res) => {
    //render view, pass in default values, undefined for errors
    res.render("addCountry", { errors: undefined, co_code: "", co_name: "", co_details: "" });
});

//If code is not 3 characters long and name is blank, will render the page again and warn user
app.post("/AddCountry",
    [check("name").isLength({ min: 1 }).withMessage("Please enter a 3 character code"),
    check("code").isLength({ min: 3, max: 3 }).withMessage("Please enter a name")],
    (req, res) => {
        //Get errors from validation chain, if any
        var errors = validationResult(req);
        //if there are any errors
        if (!errors.isEmpty()) {
            //render the page again, but this time we pass in our errors so their messages will be displayed to the user
            //We pass in the current values as well, so we can keep the ones that were already entered, so the user doesn't lose their work
            res.render("addCountry", { errors: errors.errors, co_code: req.body.code, co_name: req.body.name, co_details: req.body.details });
        }
        //else proceed
        else {
            mySQLDAO.addCountry(req.body.code, req.body.name, req.body.details)
                .then((result => {
                    //redirect back to list page
                    res.redirect("/ListCountries");
                }))
                .catch((error => {
                    res.send(error);
                }));
        }
    })

//Table list of all cities
app.get("/ListCities", (req, res) => {
    //pass in undefined id to get all cities
    mySQLDAO.getCities(undefined)
        .then((result) => {
            res.render("ListCities", { cities: result });
        })
        .catch((error) => {
            //Show appropriate error message if database connection fails
            if (error.code = "ECONNREFUSED") res.send("<h1>ERROR: Connection(" + error.syscall + ") to " + error.address + ":" + error.port + " refused. Database may be offline.</h1>");

            //else just send the error info
            else res.send(error);
        });
});

//Display all details for city of given id, along with details about its country.
//This requires two queries, first we get city details, then country details, then render the view and pass those results in.
//I saw solutions using vm.feed and all that but from what I could tell, the most relatable way to do this was with nested promises
app.get("/City/:id", (req, res) => {
    //get city details
    mySQLDAO.getCities(req.params.id)
        .then((cityResult) => {
            //Now that we have the city details, we do another query to get the country details, for the country this city belongs to
            //get country details
            //(mysql queries return an array even for one result)
            mySQLDAO.getCountries(cityResult[0].co_code)
                .then((countryResult) => {
                    //render view and pass in city and country details
                    res.render("cityDetails", { city: cityResult[0], country: countryResult[0] });
                })
                .catch((error) => {
                    res.send(error);
                });
        })
        .catch((error) => {
            res.send(error);
        });
});

app.get("/ListHeadsOfState", (req, res) => {
    mongoDBDAO.getHeadsOfState()
        .then((documents) => {
            //render our view, pass our documents into an array called heads.
            res.render("listHeadsOfState", {heads:documents});
        })
        .catch((error) => {
            res.send(error);
        });
});