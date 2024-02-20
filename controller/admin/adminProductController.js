const { ProductModel } = require("../../model/productModel");
const { SubCatModel, CatModel } = require("../../model/categoryModel");
const fs = require('fs');
const path = require('path')


const viewProducts = async (req, res) => {
  const searchKey = req.query.searchKey;

  const category = req.params.category;
  const categoryTodisplay = (category === "All" || category === undefined) ? { $exists: true } : req.params.category;

  const pageNumber = parseInt(req.params.pageNumber || 0);
  const productsPerPage = 4;
  const totalPages = Math.ceil(await ProductModel.countDocuments({
    category: categoryTodisplay,
    productName: { $regex: new RegExp(searchKey, 'i') }
  }) / productsPerPage);

  const allProducts = await ProductModel
    .find({ category: categoryTodisplay, productName: { $regex: new RegExp(searchKey, 'i') } })
    .skip(pageNumber * productsPerPage)
    .limit(productsPerPage)

  res.render("./admin/adminProducts", { allProducts, pageNumber, totalPages, category });
};

const sendAddProducts = async (req, res) => {
  let errorMessage = req.session.message;
  const categories = await SubCatModel.find({});
  const catSet = new Set();
  categories.forEach((cat) => {
    catSet.add(cat.subCatName);
  });
  
  res.render("./admin/addProducts", { errorMessage, categories: catSet });
  req.session.message ='';
};

const addProducts = async (req, res) => {
  try {
    const {
      productName,
      productDesc,
      productPrice,
      productColor,
      productAgeGap,
      productQty,
      productCat,
      productSubCat,
      productBrand,
    } = req.body;
    let catCombo = await SubCatModel.findOne({ subCatName: productSubCat, category: productCat })
    if (!catCombo) {
      req.session.message = 'This category doesnot exist. Please add it to the category collection';
      // throw new Error("Category not found.");
      return res.redirect('/admin/add-products')
    }
    const mainCatId = await CatModel.findOne({ catName: productCat }).select("_id");
    const subCatId = await SubCatModel.findOne({ subCatName: productSubCat }).select('_id')

    console.log("req body : ", req.files);
    const imagePath = req.files.map((file) => {
      return "/admin/uploads/" + file.filename;
    });

    let newProduct = new ProductModel({
      productName: productName,
      stockQty: productQty,
      brand: productBrand,
      color: productColor,
      ageGap: productAgeGap,
      price: productPrice,
      desc: productDesc,
      category: productCat,
      categoryId: mainCatId,
      subCategory: productSubCat,
      subCategoryId: subCatId,
      productImages: imagePath,
    });

    newProduct
      .save()
      .then((product) => {
        console.log(`product ${product.productName} added`);
        res.redirect("/admin/add-products");
      })
      .catch((err) => {
        console.log(err);
      });

  } catch (error) {
    console.log(error);
    
  }

};

const listProduct = async (req, res) => {
  console.log("product unlisitng");
  const productId = req.query.productId;
  const listProduct = await ProductModel.findByIdAndUpdate(
    { _id: productId },
    { $set: { isListed: true } },
  );

  if (listProduct) {
    console.log("product listed");
    res.redirect("/admin/products");
  } else {
    console.log(`produt Id: ${productId} not found for listing`);
    res.redirect("/admin/products");
  }
};

const unlistProduct = async (req, res) => {
  const productId = req.query.productId;
  console.log("product unlisitng");
  const unlistProduct = await ProductModel.findByIdAndUpdate(
    { _id: productId },
    { $set: { isListed: false } },
  );
  console.log(unlistProduct);
  if (unlistProduct) {
    console.log("product  unlisted");
    res.redirect("/admin/products");
  } else {
    console.log(`produt Id: ${productId} not found for unlisting`);
    res.redirect("/admin/products");
  }
};

const sendEditProduct = async (req, res) => {
  try {
    const productId = req.query.productId;
    const product = await ProductModel.findOne({ _id: productId });
    const categories = await SubCatModel.find({});
    const catSet = new Set();
    const catgs = categories.forEach((cat) => {
      catSet.add(cat.subCatName);
    });

    if (product) {
      res.render("./admin/editProduct", { categories: catSet, product: product });
    } else {
      console.log("Cannot find the product to edit");
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error)
  }

};

const editProducts = async (req, res) => {
  try {
    let {
      productName,
      productDesc,
      productBrand,
      productColor,
      productPrice,
      productAgeGap,
      productQty,
      productCat,
      productSubCat,
      productId,
      productImages
    } = req.body;
    console.log(req.body)

    

    const catId = await CatModel.findOne({ catName: productCat }).select("_id")
    const subCatId = await SubCatModel.findOne({ subCatName: productSubCat }).select("_id");
    const product = await ProductModel.findOne({_id:productId})
    let newImagePath = product?.productImages;
    console.log("file names : ", req.files.productImages);
    if(req.files.productImages){
      for(let i=0;i<req.files.productImages.length;i++){
        let imagePath = path.join(__dirname,'../../public',product.productImages[i]);
        console.log(imagePath);
        fs.unlink(imagePath,(err)=>{
          if(err){
            console.log( 'error deleting image',err);
            return;
          }
        })
        newImagePath[i] = '/admin/uploads/'+req.files.productImages[i].filename
      }
    }
    
    console.log('newpath',newImagePath)
    const updateProd = await ProductModel.findByIdAndUpdate(productId, {
      productName: productName,
      stockQty: productQty,
      brand: productBrand,
      color: productColor,
      ageGap: productAgeGap,
      price: productPrice,
      desc: productDesc,
      category: productCat,
      categoryId: catId,
      subCategory: productSubCat,
      subCategoryId: subCatId,
      productImages:newImagePath
    });
    if (updateProd) {
      console.log(`${productName} updated`)
      res.redirect('/admin/products')
    } else {
      console.log(`${productName} cannot be updated`)
      res.redirect('/admin/edit-product')
    }
  } catch (err) {
    console.log(err)
  }
};

const deleteProduct = async (req, res) => {
  try {
    const prodId = req.query.productId
    console.log(prodId)
    const deleteProduct = await ProductModel.deleteOne({ _id: prodId })
    console.log('product deleted')
    res.redirect('/admin/products')
  } catch (err) {
    console.log(err)
    res.redirect('/admin/products')
  }
}

const searchProducts = async (req, res) => {
  const searchProduct = req.params.searchKey
  console.log(searchProduct)
  const products = await ProductModel.find({
    productName: { $regex: new RegExp(searchProduct, 'i') }
  })

  console.log(products.length)
  res.send(products)
}
module.exports = {
  viewProducts,
  sendAddProducts,
  addProducts,
  listProduct,
  unlistProduct,
  sendEditProduct,
  editProducts,
  deleteProduct,
  searchProducts
};
