const  express = require("express");
// const bodyParser = require("body-parser")
require('dotenv/config');
const morgan = require('morgan');
const path = require("path");
const userRoute = require("./routers/userRoute");
const adminRoute = require("./routers/adminRoute");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const session = require("express-session");
const {v4 : uuidv4} = require('uuid');
const mongoose = require('mongoose');
const flash = require('connect-flash');



const api = process.env.API_URL
const app = express();
const port = process.env.PORT || 4500;

app.set("view engine","ejs")
app.set('views',path.join(__dirname, 'views'));


// load public folder.....
app.use(express.static(path.join(__dirname,'/public')));
app.use('/docs',express.static(path.join(__dirname,'/public/admin/')))

app.use('/admin/node_modules',express.static(path.resolve(__dirname, 'node_modules')));

app.use(session({
    secret : uuidv4(),
    resave : false,
    saveUninitialized : true
}));
app.use(flash());
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}));
app.use(morgan("tiny"))
app.use(cors())
app.options('*',cors())

app.use((req,res,next)=>{
    res.set('Cache-control','no-store,no-cache')
    next()
})

app.use('/admin',adminRoute);
app.use(`/`,userRoute);


app.listen(port,()=>{
    console.log(`server running on ${port}`)
    console.log(api)
})

