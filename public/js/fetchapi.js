
// console.log("js is loaded")
// const addToCart = document.querySelectorAll('.addToCart')
// const userAccount   = document.getElementById('userAccount')
// addToCart.forEach((element)=>{
//     element.addEventListener('click',(event)=>{
//         const productId = event.target.getAttribute('data-productId');
//         const userId = userAccount.getAttribute('data-userId')
//         fetch(`/add-to-cart/${productId}/${userId}`,{
//             method:'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//               }
//         })
//         .then(res => res.json())
//         .then((data)=>{
//             document.cookie= `cartQty=${data.cartQty}`
//             console.log(data.cartQty)
//             document.getElementById('cart-qty').innerText = data.cartQty
//             element.innerText = 'Remove from cart'
//             element.classList.replace('btn-success', 'btn-warning')    
//         }).catch((err)=>[
//             console.log(err)
//         ])
//     })
// })

