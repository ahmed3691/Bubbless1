const bcrypt = require("bcrypt");
const validator = require("validator");
const { UserModel } = require("../../model/usersModel");
const jwt = require("jsonwebtoken");
const { sendOtpMail } = require("../../config/userConfig");
const {CartModel} = require('../../model/cartModel')
const{getUserId,getCartQty} = require('../../config/userConfig')

const home = (req, res) => {
  try {
    const isAuthenticated = req.cookies.userAccessToken ?  true : false;
    const userId = req.userId;
    const cartQty = req.cookies.cartQty;
    res.render("./user/home", { isAuthenticated,userId,cartQty });
  } catch (err) {
    res.send(err);
  }
};

const login = (req, res) => {
  try {
    if (req.session.user) return res.redirect("/");
    const isAuthenticated = req.cookies.userAccessToken || false;
    const userId = req.cookies.userId;
    const cartQty = req.cookies.cartQty;
    let message = req.flash("message");
    console.log('flash message=====>',message)
    res.render("./user/userLogin", { message });
  } catch (err) {
    console.log(err);
  }
};

const loginUser = async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;
    const userExists = await UserModel.findOne({ userEmail: userEmail });
    if (!userExists) {
      req.flash("message", "This user doesnt exist");
      return res.redirect("/login");
    }
    if (userExists && bcrypt.compareSync(userPassword, userExists.userPassword)) {
      if(userExists.isBlocked === true){
        req.flash('message','Sorry you have been blocked for violating our policies. For further clarifications you may contact our admin.')
        return res.redirect('/login')
      }
      const userId = userExists._id;
      const cartQty = await getCartQty(userId);
      const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: "1d",
      });
      await UserModel.updateOne({ userEmail: userEmail },{ $set: { accessToken: accessToken } });
      res.cookie("userAccessToken", accessToken, {
        httpOnly: true,
        maxAge: 1 * 24 * 60 * 60 * 1000,
      }); 
      res.cookie('cartQty',cartQty)
      req.session.user = userEmail;
      req.session.isAuthenticated = true;
      res.redirect("/");
    } else {
      req.flash("message", "invalid credentials");
      res.redirect("/login");
    }
  } catch (err) {
    console.log(err);
    return res.send(err);
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("userAccessToken");
    res.clearCookie('userId')
    res.clearCookie('cartQty')
    req.session.destroy();
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
};

const getRegister = (req, res) => {
  if (req.session.user) return res.redirect("/");
  message = req.flash("message");
  console.log(message);
  res.render("./user/userRegister", { message: message });
};

const registerUser = async (req, res) => {
  try {
    const { userName, userPh, userEmail, userPassword } = req.body;
    if (userName.trim() === "") {
      req.flash("message", "Username cannot be empty");
      return res.redirect("/register");
    }
    if (!validator.isEmail(userEmail)) {
      console.log("not valid mail");
      req.flash("message", "Please enter a valid email adress");
      return res.redirect("/register");
    }
    if (userPassword.length < 4) {
      console.log("not valid password");
      req.flash("message", "Passwords must contain more than 4 charactors");
      return res.redirect("/register");
    }

    const userExist = await UserModel.findOne({
      userEmail: { $regex: new RegExp(userEmail, "i") },
    });
    if (userExist) {
      req.flash("message", "This user already exists");
      return res.redirect("/register");
    }
    // let randomNumber = Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    const newUser = new UserModel({
      userName: userName,
      userPh: userPh,
      userEmail: userEmail,
      userPassword: hashedPassword,
      isVerified: false,
      
    });

    setTimeout(async () => {
      await UserModel.updateOne(
        { userEmail: userEmail },
        { $unset: { userOtp: {} } },
      );
      console.log("otp removed");
    }, 120000);

    sendOtpMail( userEmail);

    req.session.newUser = userEmail;
    req.newUser;

    newUser
      .save()
      .then((user) => {
        res.redirect("/otp");
      })
      .catch((err) => {
        console.log(err);
        res.send(err);
      });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (updateOtp) {
      sendOtpMail(userEmail);
      setTimeout(async () => {
        await UserModel.updateOne(
          { userEmail: userEmail },
          { $unset: { userOtp: {} } },
        );
        console.log("otp removed");
      }, 120000);
      res.redirect("/otp");
    }
  } catch (err) {
    console.log(err);
  }
};

const loadOtp = async (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  }
  console.log(req.session.newUser);
  let newUser = req.session.newUser;
  let message = req.flash("message");
  console.log("message from redirect", message);
  res.render("./user/otp", {
    userEmail: newUser,
    message: message,
  });
};

const verifyOtp = async (req, res) => {
  const { userOtp, userEmail } = req.body;

  req.session.newUser = userEmail;
  const dbOtp = await UserModel.findOne({ userEmail: userEmail }).select(
    "userOtp",
  );

  if (dbOtp && userOtp == dbOtp.userOtp) {
    await UserModel.updateOne(
      { userEmail: userEmail },
      { $set: { isVerified: true }, $unset: { userOtp: {} } },
    );

    req.flash(
      "message",
      "Account created successfully. Please login to proceed",
    );
    res.redirect("/login");
  } else {
    console.log("OTP verification failed");
    req.flash("message", "OTP verifiation failed. Try resending the OTP");
    res.redirect("/otp");
  }
};

const sendOtpForNewPassword = (req,res)=>{
  const userId = req.userId
  const userEmail = req.userEmail;
  sendOtpMail(userEmail)
  res.render('./user/changePasswordOtp')
}

const verifyOtpForNewPassword = async (req,res)=>{
  const userId = req.userId;
  const userEmail = req.userEmail;
  const userOtp = req.body.userOtp;
  const dbOtp = await UserModel.findOne({ userEmail: userEmail }).select(
    "userOtp",
  );

  if (dbOtp && userOtp == dbOtp.userOtp) {
    await UserModel.updateOne(
      { userEmail: userEmail },
      { $set: { isVerified: true }, $unset: { userOtp: {} } },
    );
    req.flash(
      "message",
      "Account created successfully. Please login to proceed",
    );
    
   res.render('./user/changePassword')
  } else {
    console.log("OTP verification failed");
    req.flash("message", "OTP verifiation failed. Try resending the OTP");
    res.redirect("/otp");
  }
}

const changePassword = async (req,res) =>{
  try{
    const{newPassword} = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const userId = req.user;
    const updatePassword = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { userPassword: hashedPassword } }
    );
    
    res.clearCookie("userAccessToken");
    res.clearCookie('userId')
    res.clearCookie('cartQty')
    req.session.destroy();
    res.redirect("/login");
    
  }catch(err){
    console.log(err)
  }
 
}

module.exports = {
  home,
  registerUser,
  loginUser,
  verifyOtp,
  login,
  logout,
  getRegister,
  loadOtp,
  resendOtp,
  sendOtpForNewPassword,
  verifyOtpForNewPassword,
  changePassword
};
