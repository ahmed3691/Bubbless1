const express = require("express");
const adminRouter = express.Router();
const multer = require("multer");
const path = require("path");

const { adminAuth } = require("../middlewares/adminMWs");
const adminController = require("../controller/admin/adminController");
const adminUserController = require("../controller/admin/adminUserCont");
const adminProdController = require("../controller/admin/adminProductController")
const adminCatController = require("../controller/admin/categoryController")
const adminOrderController = require('../controller/admin/adminOrderController');
const adminSalesController = require('../controller/admin/reportController');
const adminDiscountController = require('../controller/admin/discountsController')


const storage = multer.diskStorage({
  
  destination: function (req, file, cb) {
    console.log('file from multer'.file)
    cb(null, "./public/admin/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

//Admin login controlls...........................

adminRouter.route("/")
  .get(adminAuth,adminController.sendAdminPanel);
adminRouter.route('/login')
  .get(adminController.adminLogin)
  .post(adminController.adminPanel) 
adminRouter.route("/logout")
  .get(adminController.adminLogout);
adminRouter.route('/dashboard-analytics')
  .get(adminAuth,adminController.analytics)


// for user controlls....................................................

adminRouter.route("/users")
  .get(adminAuth, adminUserController.getUsers);
adminRouter.route("/blockUser")
  .post(adminAuth, adminUserController.blockUser);
adminRouter.route("/unblockUser")
  .post(adminAuth,adminUserController.unblockUser);

//for product management.....................................................

adminRouter.route("/products/:category/:pageNumber")
  .get(adminAuth, adminProdController.viewProducts); 
adminRouter.route('/products')
  .get(adminAuth,adminProdController.viewProducts)
adminRouter.route("/add-products")
  .get(adminAuth,adminProdController.sendAddProducts)
  .post(upload.array('croppedImages', 4), adminProdController.addProducts);
adminRouter.route('/list-product')
  .post(adminProdController.listProduct)
adminRouter.route('/unlist-product')
  .post(adminProdController.unlistProduct)
adminRouter.route('/edit-product')
  .get(adminAuth,adminProdController.sendEditProduct)
  .post(upload.fields([{name:'productImages',maxCount:4}]),adminProdController.editProducts)
adminRouter.route('/search-products/:searchKey')
  .get(adminAuth,adminProdController.searchProducts)


//Category Management..............................

adminRouter.route('/categories')
  .get(adminAuth,adminCatController.viewCat)
adminRouter.route('/add-category')
  .get(adminAuth,adminCatController.sendAddCat)
  .post(adminCatController.addCat)
adminRouter.route('/delete-product')
  .post(adminProdController.deleteProduct)
adminRouter.route('/list-category')
  .post(adminCatController.listCat)
adminRouter.route('/unlist-category')
  .post(adminCatController.unlistCat)
adminRouter.route('/edit-category')
  .get(adminAuth,adminCatController.sendEditCategory)
  .post(adminCatController.editCat)
adminRouter.route('/delete-category')
  .post(adminCatController.deleteCat)

// order management 

adminRouter.route('/orders/:pageNumber')
  .get(adminAuth,adminOrderController.getOrders)
adminRouter.route('/cancel-order/:action/:id')
  .get(adminAuth,adminOrderController.editOrderStatus);
adminRouter.route('/order-details/:id')
  .get(adminAuth,adminOrderController.singleOrder)

  //reports.................................

adminRouter.route('/sales-report')
  .get(adminAuth,adminSalesController.salesReport)
adminRouter.route('/sales-data/:from/:to')
  .get(adminAuth,adminSalesController.salesData);


  //offers and discounts.....................

  adminRouter.route('/offers')  
    .get(adminAuth,adminDiscountController.getOffers)
    .post(adminAuth,adminDiscountController.createOffer)
    .put(adminAuth,adminDiscountController.editOffer)
    .delete(adminAuth,adminDiscountController.deleteOffer)
  adminRouter.route('/create-offer')
    .get(adminAuth,adminDiscountController.getCreateOffer);
  adminRouter.route('/edit-offer/:id')
    .get(adminAuth,adminDiscountController.getEditOffer);
  adminRouter.route('/apply-offer/:id')
    .get(adminAuth,adminDiscountController.getApplyOffer)
    .post(adminAuth,adminDiscountController.applyOffer);
  adminRouter.route('/remove-offer/:id')
    .get(adminAuth,adminDiscountController.removeOffer)
  

module.exports = adminRouter;





