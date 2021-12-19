const express = require('express')
const bodyParser = require('body-parser');
const _ = require('lodash')
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'ejs');

const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://heroku:'+process.env.heroku+'@cluster0.igxpi.mongodb.net/todolistDB?retryWrites=true&w=majority', { useNewUrlParser: true });


const itemsSchema = new mongoose.Schema({
    task: String,
    checked: String
})
const item = mongoose.model('item', itemsSchema);

const listsSchema = new mongoose.Schema({
    listName: String,
    items: [itemsSchema]
});
const list = mongoose.model('list', listsSchema);

const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const defaultListName = "To-do";
app.get('/', function (req, res) {

    item.find({}, (err, tasks) => {
        res.render('list', { today: (new Date()).toLocaleDateString("en-US", options), hindi: (new Date()).toLocaleDateString("hi-IN", options), new_items: tasks, listTitle: defaultListName });
    });
})

app.get('/:listName', function (req, res) {

    const listName = _.capitalize(req.params.listName);

    list.findOne({ listName: listName }, function (err, foundList) {

        if (!err) {
            if (!foundList) {
                const newList = new list({
                    listName: listName,
                    items: []
                });
                try {
                    newList.save();
                    res.redirect('/' + listName);
                } catch (err) {
                    console.log("Error occured while saving list");
                    res.redirect('/')
                }
            }
            else {
                res.render('list', { today: (new Date()).toLocaleDateString("en-US", options), hindi: (new Date()).toLocaleDateString("hi-IN", options), new_items: foundList.items, listTitle: foundList.listName });
            }
        }
        else
            res.redirect('/');
    })
});
app.post('/', function (req, res) {

    const listTitle = _.capitalize(req.body.listTitle);
    const newItem = new item({
        task: _.capitalize(req.body.text),
        checked: ""
    });

    if (listTitle === defaultListName) {
        newItem.save();
        res.redirect('/');
    }
    else {
        list.findOne({ listName: listTitle }, function (err, foundList) {
            if (!err) {
                foundList.items.push(newItem);
                foundList.save();
            }
            res.redirect('/' + listTitle);
        })
    }

})
app.post('/check', function (req, res) {
    const itemID = req.body.checkbox;
    const listTitle = _.capitalize(req.body.listTitle);

    // if (itemID) {
    if (listTitle === defaultListName) {
        item.findOneAndUpdate({ _id: itemID }, { checked: "checked disabled" }, function (err) {
            if (err) {
                console.log("Error occured while updating");
            }
        });
        res.redirect('/');
    }
    else {

        const query = { listName: listTitle, "items._id": itemID };
        list.updateOne(query, { $set: { "items.$.checked": "checked disabled" } }, function (error) {
            if (error)
                console.log(error);
        });

        res.redirect('/' + listTitle)
    }
    // }
    // else {
    //     res.redirect('/');
    // }

});

app.post('/delete', function (req, res) {

    const listTitle = _.capitalize(req.body.listTitle);

    if (listTitle === defaultListName) {
        item.deleteMany({ checked: "checked disabled" }, function (err) {
            if (err) {
                console.log("Error occured while deleting");
            }
        })
        res.redirect('/')
    }
    else {

        const update_query = {
            $pull: { items: { checked: { $in: "checked disabled" } } }
        };
        list.updateMany({ listName: listTitle }, update_query, function (error) {
            if (error)
                console.log(error);
        });

        res.redirect('/' + listTitle)
    }
});

let port = 3000
app.listen(port, () => console.log('Testing console on port ' + String(port)))