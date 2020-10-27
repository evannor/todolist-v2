//jshint esversion:6

// Node modules used for this project
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// Set up express
const app = express();
// Allow for templating with EJS
app.set('view engine', 'ejs');
// Use body-parser
app.use(bodyParser.urlencoded({
  extended: true
}));
// Tell express where to access static files
app.use(express.static("public"));
// Connect with Mongoose ODM, and pass info to receive no errors
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

// Create schema to outline how info is saved in server
const itemsSchema = ({
  name: String
});
const Item = mongoose.model('Item', itemsSchema);

// Items to appear at the beginning of all new lists
const item1 = new Item({
  name: "Let's knock out another day!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete and item."
});
// Array which holds basic new list items
const defaultItems = [item1, item2, item3];

// New schema for custom lists
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model('List', listSchema);

// Prevent the creation of favicon item in database
app.get('/favicon.ico', (req, res) => res.status(204));

// GET route for home page
app.get("/", function(req, res) {
  // Checks to see if todo list is already in database
  Item.find({}, function(err, items) {
    if (items.length === 0) { // if the list does not already exist
      Item.insertMany(defaultItems, function(err) { //insert the default items into database
        if (!err) {
          console.log("Successfuly added defaultItems");
        }
      });
      res.redirect("/"); //head to the home get route
    } else { //items already exist in the database
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  });
});

app.post("/", function(req, res) {
  // saves user input from to do list
  const itemName = req.body.newItem;
  // saves name of current working to do list
  const listName = req.body.list;
  // reformats user input to match schema
  const newItem = new Item({
    name: itemName
  });
  // check to see if updating basic or custom list
  if (listName === "Today") {
    // adds items to basic list
    newItem.save();
    res.redirect("/");
  } else {
    // Finds previously created to do list and adds new item to that list
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

// route for when user deletes item from list
app.post("/delete", function(req, res) {
  // triggers when checkbox is clicked
  const checkedItemId = req.body.checkbox;
  // Checks the value of list name when item is deleted
  const listName = req.body.listName;

  if (listName === "Today") {
    // removes selected items and directs to home route
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    // removes item from custom list
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

// Create and go back to custom lists
app.get("/:customList", function(req, res) {
  // User inputs name of list as parameters in the the URL
  // lodash sets the name to the text
  const customList = _.capitalize(req.params.customList);
  // First checks to see if that list has already been made
  List.findOne({
    name: customList
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customList,
          items: defaultItems
        });
        list.save(function(err, result) {
          res.redirect("/" + customList);
        });
      } else {
        // Show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

// app.get("/work", function(req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
