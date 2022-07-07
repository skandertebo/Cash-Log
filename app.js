const _ = require('lodash');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const DiffInDays = require('./dateDiff.js');
mongoose.connect("mongodb+srv://skandertebo:galaxys41842002messi@cluster0.4a6gx.mongodb.net/?retryWrites=true&w=majority", { useUnifiedTopology: true, useNewUrlParser: true });

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');

const UserSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique:true,
    },
    password:{
        type: String,
        required: true
    },
    categories:[String],
    budget:{
        type: String,
        required: true
    },
    months:[{
        id:Number,
        date:Date,
        totalDeposits:Number,
        categories:[{
            categoryName:String,
            CategoryDeposit:Number
        }]
    }]
})


const User = new mongoose.model('User' , UserSchema);


let user;
app.get('/', (req, res)=>{
    
    User.findOne((err , usr)=>{
        const nextDate = new Date(usr.months[usr.months.length-1].date.getFullYear() ,  usr.months[usr.months.length-1].date.getMonth() +1  , usr.months[usr.months.length-1].date.getDay());
        const daysRemaining = DiffInDays(usr.months[usr.months.length-1].date , nextDate);
        user = usr ;
        res.render("index.ejs" , {userName:usr.firstName + " " + usr.lastName,
                                  funds:usr.budget-usr.months[usr.months.length-1].totalDeposits,
                                  days : daysRemaining ,
                                  categories: usr.months[usr.months.length-1].categories ,
                                  totalDeposits:usr.months[usr.months.length-1].totalDeposits });
    })
});
app.post('/add-deposits' , (req, res)=>{
    let lastValue ;
    let i = 0;
    while(user.months[user.months.length-1].categories[i].categoryName!=req.body.categorySelect){
        i++;
    }
    lastValue = user.months[user.months.length-1].categories[i].CategoryDeposit;
    console.log(req.body);
    User.updateOne({},
                   {$set:{"months.$[month].categories.$[category].CategoryDeposit":lastValue+parseInt(req.body.deposit),
                          "months.$[month].totalDeposits":user.months[user.months.length-1].totalDeposits+parseInt(req.body.deposit)
                        } 
                    },
                    {arrayFilters:[{'month.id' : 1 },{'category.categoryName' : req.body.categorySelect}]},
                    (err)=>{
                                if(!err){
                                    console.log("updated succesfully");
                                    res.redirect("/");
                                }
                            
                                else{
                                    console.log(err);
                                    res.send("error");
                                }
                            });
                  
});
app.post('/' , (req, res)=>{
    console.log(req.body);
    User.updateOne({} , { $push : {
                            "months.$[month].categories": { 
                                                            categoryName:req.body.newCategory,
                                                            CategoryDeposit:0
                            },
                            categories:req.body.newCategory
                        }
    },
    {arrayFilters:[{'month.id' : 1}]},
    (err)=>{
        if(!err){
            console.log("categories updated successfully");
        }else{
            console.log(err);
        }
    })
})


app.listen(process.env.PORT || 3000, ()=>{
    console.log("listening on port 3000");
});