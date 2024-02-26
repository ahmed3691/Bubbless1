  document.addEventListener("DOMContentLoaded", async () => {
    let addProducts = document.getElementById('addProductsPage')
    if(addProducts){
      let inputImage = document.getElementById("image-input");
      let previewImageContainer = document.getElementById("image-preview");
      let cropButton = document.getElementById("crop-button");
      let croppers = [];
      let croppedDataArray = [];
      let croppedImagesContainer = document.getElementById("cropped-images");
      let submitForm = document.getElementById("submitForm");
      let productName = document.getElementById("productName");
      let productDesc = document.getElementById("productDesc");
      let productPrice = document.getElementById("productPrice");
      let productQty = document.getElementById("productQty");
      let productBrand = document.getElementById('productBrand');
      let productColor = document.getElementById('productColor');
      let productAgeGap = document.getElementById('productAgeGap');


      croppedImagesContainer.innerHTML= ''

      inputImage.addEventListener("change", (event) => {
        console.log('file selected')
        const files = event.target.files;
        if(files.length>4){
            inputImage.value = ''
            return alert("You can only select upto 4 images")
        }

        if (files.length > 0) {
          let divCount = previewImageContainer.querySelectorAll('.view-image').length;
         
          if(files.length + croppers.length >4){
            previewImageContainer.innerHTML = "";
            croppers.length = 0;
          }
          
          

          for (let file of files) {
            let reader = new FileReader();

            reader.onload = (readEvent) => {
              let image = new Image();
              image.src = readEvent.target.result;

              let preview = document.createElement("div");
              preview.classList.add("view-image", "col-md-6");
              preview.appendChild(image);

              previewImageContainer.appendChild(preview);

              cropButton.disabled = false;

              let cropper = new Cropper(image, {
                aspectRatio: 285/396,
                viewMode: 2,
              });

              croppers.push(cropper);
            };

            reader.readAsDataURL(file);
          }
        }
      });

      cropButton.addEventListener("click", async () => {
        croppedImagesContainer.innerHTML=''
        submitForm.disabled = false;
        croppedDataArray = [];
        for (let cropper of croppers) {
          let croppedCanvas = cropper.getCroppedCanvas();

          let blobPromise = new Promise((resolve) => {
            croppedCanvas.toBlob((blob) => {
              resolve(blob);
            });
          });
          let blob = await blobPromise;

          croppedDataArray.push(blob);
          displayCroppedImage(croppedImagesContainer, blob);
        }
        console.log(croppedDataArray);

        inputImage.value = "";
      });

      function displayCroppedImage(targetDiv, blob) {
        console.log("display crop image");
        let img = document.createElement("img");
        img.src = URL.createObjectURL(blob);

        let previewCroppedImage = document.createElement("div");
        previewCroppedImage.classList.add("col-lg-6");
        previewCroppedImage.appendChild(img);

        targetDiv.appendChild(previewCroppedImage);
      }

      submitForm.addEventListener("click", async (ev) => {
       
        let form = document.getElementById("productForm");
        ev.preventDefault();
        let formData = new FormData();
        formData.append("productName",document.getElementById("productName").value);
        formData.append("productDesc",document.getElementById("productDesc").value);
        formData.append("productPrice",document.getElementById("productPrice").value);
        formData.append("productQty", document.getElementById("productQty").value);
        formData.append("productCat", document.getElementById("productCat").value);
        formData.append("productSubCat",document.getElementById("productSubCat").value);
        formData.append("productBrand",productBrand.value)
        formData.append('productColor',productColor.value)
        formData.append('productAgeGap',productAgeGap.value)

        if (!productName || !productDesc || !productPrice || !productQty || !productBrand || !productColor || !productAgeGap) {
            alert('Please fill all fields');
            return; 
        }

        for (let i = 0; i < croppedDataArray.length; i++) {
          console.log(croppedDataArray[i]);
          formData.append(`croppedImages`,croppedDataArray[i],`croppedImage_${i}.png`);
        }

        console.log(formData);
        fetch("/admin/add-products", {
          method: "POST",
          body: formData,
        })
        .then((response) => {
          // Check if the response is a redirect
          if (response.redirected) {
            // Manually redirect to the specified location
            window.location.href = response.url;
          }
        })
        .catch((error) => console.log(error));
      
      });

      productPrice.addEventListener('input',()=>{
        console.log('enter num')
        let value = productPrice.value;
        value = value.replace(/^0+/, '');

        if (value.includes("-")) {
            value = value.replace('-', '');
        }
        productPrice.value = value;

      })
      
      productQty.addEventListener('input',()=>{
        
        let value = productQty.value;
        value = value.replace(/^0+/, '');

        if (value.includes("-")) {
            value = value.replace('-', '');3
        }
        productQty.value = value;

      })
    }else{
      console.log("Not in add products")
    }
  });



