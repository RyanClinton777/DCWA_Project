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
EXTRAS:
    Handle the user trying to add a head of state to a country that already has one (i.e. existing _id) - findOne, query for that id, custom error etc.
       auto UPPER CASE the country code?
    display cities attatched to a country? - button on table list
    update country?
*/

//Set view engine
app.set("view engine", "ejs");
//set bodyParser
//https://www.npmjs.com/package/body-parser#bodyparserurlencodedoptions
app.use(bodyParser.urlencoded({ extended: false }))

//HANDLE ERRORS
//Done in method here to avoid repetition and ensure consistency
//renders errorDisplay view, passing in either the normal error message, or a special message if the connection doesn't go through, as per the requirements
//Errors should be sent to this function: ---handleError(res, error);--- or can manually render errorDisplay and pass in a specific message string
//I did it this way to satisfy the requirement of showing a specific message if the connection didn't go through
var handleError = function (res, error) {
    //Database connection fails
    if (error.code == "ECONNREFUSED") {
        res.render("errorDisplay", { errorMessage: "ERROR: Connection(" + error.syscall + ") to " + error.address + ":" + error.port + " refused. Database may be offline." });
    }
    //else show generic error info
    else res.render("errorDisplay", { errorMessage: error });
}

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
            handleError(res, error);
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
                //Not an actual error, but use the error display anyway to warn user
                res.render("errorDisplay", { errorMessage: "Country with ID: [" + req.params.id + "] doesn't exist." });
            }
        })
        //ditto but rejection, and error
        .catch(() => {
            handleError(res, error);
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
                    handleError(res, error);
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
            //Show specific message if it can't be deleted due to foreign key constraints
            if (error.code == "ER_ROW_IS_REFERENCED_2") {
                res.send("<h3>Cannot delete country with code: [" + req.params.id + "], there are cities associated with it.</h3>");
            }
            //else just print the message
            else handleError(res, error);
        })
});

//show form for adding a country to the mysql db
app.get("/AddCountry", (req, res) => {
    //render view, pass in default values, undefined for errors
    res.render("addCountry", { errors: undefined, co_code: "", co_name: "", co_details: "" });
});

//Add country - If code is not 3 characters long and/or name is blank, will render the page again and warn user
app.post("/AddCountry",
    [check("code").isLength({ min: 3, max: 3 }).withMessage("Please enter a 3 character code"),
    check("name").isLength({ min: 1 }).withMessage("Please enter a name")],
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
            //But first, make sure country doesn't already exist
            mySQLDAO.getCountries(req.body.code)
                .then((result) => {
                    //if length isn't 0, country exists so error should be displayed
                    if (result.length > 0) {
                        //add custom error and render page again
                        errors.errors.push({ value: "", msg: "Country with that code already exists.", param: "custom", location: "body" });
                        res.render("addCountry", { errors: errors.errors, co_code: req.body.code, co_name: req.body.name, co_details: req.body.details });
                    }
                    //else country doesn't exist, can add this new one
                    else {
                        //Finally add the country
                        mySQLDAO.addCountry(req.body.code, req.body.name, req.body.details)
                            .then((result => {
                                //redirect back to list page
                                res.redirect("/ListCountries");
                            }))
                            .catch((error => {
                                handleError(res, error);
                            }));
                    }
                })
                .catch((error) => {
                    handleError(res, error);
                });
        }
    });

//Table list of all cities
app.get("/ListCities", (req, res) => {
    //pass in undefined id to get all cities
    mySQLDAO.getCities(undefined)
        .then((result) => {
            res.render("ListCities", { cities: result });
        })
        .catch((error) => {
            handleError(res, error);
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
                    handleError(res, error);
                });
        })
        .catch((error) => {
            handleError(res, error);
        });
});

app.get("/ListHeadsOfState", (req, res) => {
    mongoDBDAO.getHeadsOfState()
        .then((documents) => {
            //render our view, pass our documents into an array called heads.
            res.render("listHeadsOfState", { heads: documents });
        })
        .catch((error) => {
            handleError(res, error);
        });
});

app.get("/AddHead", (req, res) => {
    //render view, pass in defaults
    res.render("addHeadOfState", { errors: undefined, co_code: "", headOfState: "" });
});

//Add head - Country code must be 3 characters, head of states name at least 3.
//Checks the mysql country database to make sure the specified country exists, only then will it be created (unless the head themselves already exists).
app.post("/AddHead",
    [check("head").isLength({ min: 3 }).withMessage("Name must have at least 3 characters."),
    check("code").isLength({ min: 3, max: 3 }).withMessage("Please enter a 3 character country code.")],
    (req, res) => {
        //Get errors array (JSON) from validation chain, if any
        var errors = validationResult(req);
        //if there are any errors
        if (!errors.isEmpty()) {
            //render the page again, but this time we pass in our errors so their messages will be displayed to the user
            //We pass in the current values as well, so we can keep the ones that were already entered, so the user doesn't lose their work
            console.log("ERRORS: " + JSON.stringify(errors.mapped()));
            res.render("addHeadOfState", { errors: errors.errors, co_code: req.body.code, headOfState: req.body.head });
        }
        else {
            //check if country for given code exists
            mySQLDAO.getCountries(req.body.code)
                .then((result) => {
                    //Can only add a HOS If their country exists (can only be 1 result since it's a primary key)
                    if (result.length == 1) {
                        //Add the record using data from the body of the request, from the input form
                        mongoDBDAO.addHeadOfState(req.body.code, req.body.head)
                            .then((result) => {
                                res.redirect("/ListHeadsOfState");
                            })
                            .catch((error) => {
                                handleError(res, error);
                            });
                    }
                    //Else if the country doesn't exist, render page again with custom warning
                    else {
                        //If the country does not exist, it should show an error message
                        //To do this, I am creating putting a custom, made-up error document and passing it into errors.errors, since it is just JSON. (errors field in the errors JSON object)
                        //I don't know if this is the best way to do this but I wasn't having much success googling it
                        errors.errors.push({ value: "", msg: "No country with that code exists in the MySQL database.", param: "custom", location: "body" });
                        //console.log( JSON.stringify(errors) ); //DEBUG
                        //Render page again with current values and our custom error document inside the errors object.
                        res.render("addHeadOfState", { errors: errors.errors, co_code: req.body.code, headOfState: req.body.head });
                    }
                })
                .catch((error) => {
                    handleError(res, error);
                });
        }
    });