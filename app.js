
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const mongoose = require('mongoose');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const uri = process.env.MONGO_DB_URI;

mongoose.connect(uri, {useNewUrlParser: true});

//creating first items as hints for using the app
const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);



app.get("/", (req, res) => {
    
  Item.find({}, (err, foundItems) => {

    //inserts default items when list is empty
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => err ? console.log(err) : console.log("Succesfully saved default items to DB"));
      res.redirect("/");
      }
     else if (err) {
        console.log(err);
      }
      else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    });
  });

  //creating custom lists
app.get("/:customListName", (req, res) => {
    
    //making list names capitalized
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, (err, foundList) => {
      if (!err) {
        if (!foundList) {
          //Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });

          list.save();
          res.redirect("/" + customListName);

        } else {
        //Show existing list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }};
    })

    
})

app.post("/", (req, res) => {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item4 = new Item({
      name: itemName
    });

  //saving items do main list
    if(listName === "Today") {
      item4.save();
      res.redirect("/");
    } else {
      //unless the name is a custom list's name
      List.findOne({name: listName}, (err, foundList) => {
        if (!err) {
          foundList.items.push(item4);
          foundList.save(() => {
          res.redirect("/" + listName); 
        });
        
        } else {
          console.log(err);
        }
      });
    }  
  });

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    //deafult list is a seperate collection so we just remove an item from there
    if (listName === "Today") {
      Item.findByIdAndRemove(checkedItemId, (err) => err ? console.log(err) : console.log("Item deleted"));

      res.redirect("/");
    } else {
      //custom lists are objects in another collection so we have to update the array of items in one to delete the chosen item
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
    }
  });

app.get("/about", (req, res) => {
    res.render("about");
  });

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started on port 3000");
  });
