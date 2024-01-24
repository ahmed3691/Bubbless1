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


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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
  .post(adminProdController.editProducts)
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

adminRouter.route('/orders')
  .get(adminAuth,adminOrderController.getOrders)
adminRouter.route('/order-details')
  .get(adminAuth,adminOrderController.orderDetails)
adminRouter.route('/cancel-order/:action/:id')
  .get(adminAuth,adminOrderController.cancelOrder);
adminRouter.route('/order-details/:id')
  .get(adminAuth,adminOrderController.singleOrder)

module.exports = adminRouter;





