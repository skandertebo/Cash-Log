const _ = require('lodash');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require("express-session");
const mongodbSession = require('connect-mongodb-session')(session);
const bcrypt = require('bcrypt');
const saltRounds = 10;
const DiffInDays = require('./dateDiff.js');
const uri = "mongodb+srv://skandertebo:galaxys41842002messi@cluster0.4a6gx.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true });

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true
}));

const store = new mongodbSession({
    uri: uri,
    collection: 'userSessions'
});


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store : store
}))
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
        type: Number,
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

const homeMiddleware = (req, res, next) => {
    if(req.session.isAuth){
        next();
    }
    else{
        res.redirect("/login")
    }
}

const loginRegisterMiddleware = (req, res, next) => {
    if(req.session.isAuth){
        res.redirect("/");
    }
    else {
        next();
    }
}

app.get('/', homeMiddleware , (req, res)=>{
    
    User.findOne({_id:req.session.user} , (err , usr)=>{
        const nextDate = new Date(usr.months[0].date);
        nextDate.setMonth(nextDate.getMonth() + 1);
        const today = new Date();
        const daysRemaining = DiffInDays(nextDate, today);
        if(daysRemaining<=0){
            let month = {
                id:usr.months.length+1,
                date:today,
                totalDeposits:0,
                categories:[]
            }
            usr.categories.forEach((category)=>{
                month.categories.push({
                    categoryName:category,
                    CategoryDeposit:0
                })
            })
            User.updateOne(
                {_id:req.session.user},
                {$push:{
                    months:{
                        $each:[month],
                        $position:0
                    }
                }},
                (err)=>{
                    if(err){
                        throw err;
                    }
                    else{
                        res.redirect("/")
                    }
            })
        }
        res.render("index.ejs" , {userName:usr.firstName + " " + usr.lastName,
                                  funds:usr.budget-usr.months[0].totalDeposits,
                                  days : daysRemaining ,
                                  categories: usr.months[0].categories ,
                                  totalDeposits:usr.months[0].totalDeposits });
    })
});

app.post('/add-deposits' , (req, res)=>{

    User.updateOne({_id:req.session.user,"months.id" : {$gte : 1}},
                   {$inc:{"months.$.categories.$[category].CategoryDeposit":parseInt(req.body.deposit),
                          "months.$.totalDeposits":parseInt(req.body.deposit)
                        } 
                    },
                    {arrayFilters:[{'category.categoryName' : req.body.categorySelect}]},
                    (err)=>{
                                if(!err){
                                    //console.log("updated succesfully");
                                    res.redirect("/");
                                }
                            
                                else{
                                    res.send("error");
                                    throw err;
                                }
                            });
                  
});
app.post('/' , (req, res)=>{
    User.updateOne({_id:req.session.user} , { $push : {
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

app.get('/login' , loginRegisterMiddleware, (req, res)=>{
    res.render('login.ejs' , {});
})
app.post('/login', (req, res)=>{
    User.findOne({email:req.body.email} , (err, user)=>{
        if(!user){
            console.log("user not found");
            res.redirect('/login');
        }
        else{
            bcrypt.compare(req.body.password, user.password, function(err, result) {
                if(!err){
                    if(result){
                        req.session.regenerate((err)=>{
                            if(err){throw err;}
                            else{
                                req.session.isAuth = true;
                                req.session.user = user._id;
                                req.session.save((err)=>{
                                    if(!err){
                                        res.redirect("/");
                                    }
                                    else{
                                        throw err;
                                    }
                                })
                            }
                        })
                    }
                    else{
                        res.redirect("/login");
                    }
                }
                else{
                    throw err;
                }
            });
        }
    })
})
app.get('/register',loginRegisterMiddleware , (req, res)=>{
    res.render('register.ejs' , {});
})
app.post('/register', (req, res)=>{
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        const user = new User({
            firstName:req.body.firstName,
            lastName:req.body.lastName,
            email: req.body.email,
            password:hash,
            categories: [],
            budget:req.body.budget,
            months:[
                {
                    id:1,
                    date: new Date(),
                    totalDeposits:0,
                    categories:[]
                }
            ]
        
        });
        console.log(user);
        user.save((error)=>{
            if(!error){
                console.log("added user");
                res.redirect("/login");
            }
            else{
                throw error;
            }
        });
    });
})

app.get("/logout" , (req, res)=>{
    req.session.destroy();
    res.redirect("/");
})


app.listen(process.env.PORT || 3000, ()=>{
    console.log("listening on port 3000");
});