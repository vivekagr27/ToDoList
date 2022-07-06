//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
let day = "";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const uri = process.env.DB_URI;

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });
const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
    name: "Welcome to your todo List!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item"
});
const item3 = new Item({
    name: "<--Hit this to delete an item"
});
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);
const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

    day = date.getDay();
    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany([item1, item2, item3], function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items.");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: day, newListItems: foundItems });
        }




    });
});
app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);
    console.log(customListName);
    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                //create new listTitle
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                //show an existing list
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });

            }
        }
    });

});

app.post("/", function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;
    console.log(listName);
    const item = new Item({
        name: itemName
    });
    if (listName === day) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });

    }

});
app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === day) {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if (!err) {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }

        });

    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }

});


app.get("/about", function(req, res) {
    res.render("about");
});
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function() {
    console.log("Server started on port 3000");
});