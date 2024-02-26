const bcrypt = require("bcrypt");
const validator = require("validator");
const { UserModel } = require("../../model/usersModel");
const jwt = require("jsonwebtoken");
const { sendOtpMail } = require("../../config/userConfig");
const {CartModel} = require('../../model/cartModel');
const {ProductModel} = require('../../model/productModel')
const{getUserId,getCartQty} = require('../../config/userConfig');
const {BannerModel} = require('../../model/adminBannerModel')

const home = async (req, res) => {
  try {
    
    const isAuthenticated = req.cookies.userAccessToken ?  true : false;
    const userId = req.userId;
    const cartQty = req.cookies.cartQty;
    const banners = await BannerModel.findOne({})
    const products = await ProductModel.find({}).limit(8).populate('appliedOffer')
    res.render("./user/home", {
      isAuthenticated,
      userId,
      cartQty,
      products,
      banners
    });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
};

const login = (req, res) => {
  try {
    if (req.session.user) return res.redirect("/");
    let message = req.flash("message");
 
    res.render("./user/userLogin", { message });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
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
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("userAccessToken");
    res.clearCookie('userId')
    res.clearCookie('cartQty')
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
};

const getRegister = (req, res) => {
  try {
    if (req.session.user) return res.redirect("/");
    message = req.flash("message");
    
    res.render("./user/userRegister", { message: message });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
 
};

const registerUser = async (req, res) => {
  try {
    
    const { userName, userPh, userEmail, userPassword,refferalCode } = req.body;
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
    console.log('validation completed')
    const userExist = await UserModel.findOne({
      userEmail: { $regex: new RegExp(userEmail, "i") },
    });
    if (userExist) {
      req.flash("message", "This user already exists");
      return res.redirect("/register");
    }
   
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    const newUser = new UserModel({
      userName: userName,
      userPh: userPh,
      userEmail: userEmail,
      userPassword: hashedPassword,
      isVerified: false,
    });

    newUser
      .save()
      .then((user) => {
        req.session.refferalCode = refferalCode
        req.session.newUser = userEmail;

        sendOtpMail( userEmail);

        setTimeout(async () => {
          await UserModel.updateOne(
            { userEmail: userEmail },
            { $unset: { userOtp: {} } },
          );
        }, 120000);

        res.redirect("/otp");
      })
      .catch((err) => {
        console.log('error saving user')
        console.log(err);
      });
   
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
};

const resendOtp = async (req, res) => {
  try {
    const { userEmail,refferalCode } = req.body;
   
      sendOtpMail(userEmail);
      setTimeout(async () => {
        await UserModel.updateOne(
          { userEmail: userEmail },
          { $unset: { userOtp: {} } },
        );
      
      }, 120000);
      req.session.newUser = userEmail
      req.session.refferalCode = refferalCode
      res.redirect("/otp");
    
  } catch (error) {
    console.log(error);
    res.render('./user/404',)
  }
};

const loadOtp = async (req, res) => {
  try {
    if (req.session.user) {
      res.redirect("/");
    }

    const refferalCode = req.session.refferalCode;
    

    let newUser = req.session.newUser;
   
    console.log(newUser,refferalCode)
    let message = req.flash("message");
    console.log("message from redirect", message);
    res.render("./user/otp", {
      userEmail: newUser,
      message: message,
      refferalCode
    });
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
};

const verifyOtp = async (req, res) => {
  try {
    const { userOtp, userEmail,refferalCode } = req.body;
    console.log('reffere code from verifyOtp:', refferalCode)
    req.session.newUser = userEmail;
    const dbOtp = await UserModel.findOne({ userEmail: userEmail }).select("userOtp");
  
    if (dbOtp && userOtp == dbOtp.userOtp) {
      await UserModel.updateOne(
        { userEmail: userEmail },
        { $set: { isVerified: true }, $unset: { userOtp: {} } },
      );

      if(refferalCode){
        const refferedUser = await UserModel.updateOne(
          {refferalCode},
          {$inc:{refferalCompleted:1}})
      }

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
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
};

const sendOtpForNewPassword = (req,res)=>{
  try {
    const userId = req.userId
    const userEmail = req.userEmail;
    sendOtpMail(userEmail)
    res.render('./user/changePasswordOtp')
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
  
}

const verifyOtpForNewPassword = async (req,res)=>{
  try {
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
  } catch (error) {
    console.log(error);
    res.render('./user/404')
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
    console.log(err);
    res.render('./user/404')
  }
}

const sendResetPasswordEmail = (req,res)=>{
  try {
    res.render('./user/forgotPasswordEmail')
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
}

const sendOTP = async (req,res)=>{
  try {
    const{userEmail} = req.body;
    const user = await UserModel.findOne({userEmail});
  
    if(!user) return res.render('./user/forgotPasswordEmail',{message:'This email is not registered  '});
    
    sendOtpMail(userEmail);
    res.render('./user/forgotPasswordOTP',{userEmail})
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }

}

const resetPasswordOtp = async (req,res)=>{
  try {
    const {userOtp,userEmail} = req.body;
    console.log(req.body);

    const user = await UserModel.findOne({userEmail})

    if(!(user.userOtp == userOtp)) return res.render('./user/forgotPasswordOTP',{message:'Enterd OTP is wrong',userEmail});

    await UserModel.updateOne({userEmail},{$unset:{userOtp}});

    res.render('./user/forgotPassword',{userEmail})
  } catch (error) {
    console.log(error);
    res.render('./user/404')
  }
}

const resetPassword = async (req,res)=>{
  try {
    
    const {newPassword,userEmail} = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatePassword = await UserModel.updateOne({userEmail},{$set:{userPassword:hashedPassword}});
    res.clearCookie("userAccessToken");
    res.clearCookie('userId')
    res.clearCookie('cartQty')
    req.session.destroy();
    res.redirect("/login");
    // res.render('./user/userLogin')
  } catch (error) {
    console.log(error);
    res.render('./user/404')
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
  changePassword,
  sendResetPasswordEmail,
  sendOTP,
  resetPasswordOtp,
  resetPassword
};
