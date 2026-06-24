import {
    db,
    auth
} from "./firebase.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    getDocs,
    query,
    where,
    limit,
    startAfter
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"; 
/* =============================== EMAILJS INIT ================================ */
emailjs.init("ieRLyFY6dACVNwhog");
const EMAILJS_SERVICE_ID = "service_fmaqzsq";
const ADMIN_TEMPLATE_ID = "admin_order_received";
const USER_TEMPLATE_ID = "user_order_confirmation";
const ADMIN_EMAIL = "wonderpetsaqua@gmail.com";
 /* =============================== ADMIN CONFIG ================================ */
const ADMIN_EMAILS = [
    "wonderpetsaqua@gmail.com", 
    "tamizhkumaran1512@gmail.com"
]; 
// ✅ DATE & TIME HELPER (ADD HERE)
function getFormattedDateTime() {
  const now = new Date();

  const date = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return `${date} | ${time}`;
}
function isAdminUser() {
  return ADMIN_EMAILS.includes(auth.currentUser?.email);
}

/* =============================== DOM ================================ */
const landing = document.getElementById("landing");
const home = document.getElementById("home");
const orders = document.getElementById("orders");
const adminDashboard = document.getElementById("adminDashboard");
const contact = document.getElementById("contact");
const WHATSAPP_NUMBER = "917904480227"; // 🔁 replace with your real number 
const cartCount = document.getElementById("cart-count");
const sidebar = document.getElementById("sidebar"); 
const hamburger = document.getElementById("hamburger"); 
const cartBtn = document.getElementById("cartBtn"); 
const profileIcon = document.getElementById("profileIcon"); 
const profileDropdown = document.getElementById("profileDropdown"); 
const adminSwitch = document.getElementById("adminSwitch"); 
const cartPopup = document.getElementById("cartPopup"); 
const cartItems = document.getElementById("cartItems"); 
const cartDiscountEl = document.getElementById("cartDiscount"); 
const cartPayableEl = document.getElementById("cartPayable"); 
/* =============================== HIDE ALL MAIN SECTIONS (SAFE) ================================ */ 
function hideAllMainSections() { 
    home.style.display = "none";
    orders.style.display = "none"; 
    contact.style.display = "none"; 
    adminDashboard.style.display = "none"; 
    orders.classList.remove("fullscreen-section"); 
    contact.classList.remove("fullscreen-section"); 
    activePage = null; 
 } 
 /* =============================== STATE ================================ */ 
 let products = []; 
 let cart = []; 
 /* ===============================
   CART PERSISTENCE (SAFE)
================================ */

function saveCart() {
  localStorage.setItem("wonder_cart", JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem("wonder_cart");
  if (saved) {
    cart = JSON.parse(saved);
    updateCartCount();
  }
}

 let adminMode = false; 
 let editingProductId = null; 
 /* ===============================
   INFINITE SCROLL STATE (HOME)
================================ */
const SCROLL_PAGE_SIZE = 8;
let visibleCount = SCROLL_PAGE_SIZE;
let activeFilteredProducts = [];
 /* =============================== CURRENT ACTIVE PAGE ================================ */ 
 let activePage = null;
 // "orders" | "contact" | "admin" | null // 
 /* =============================== ADMIN ORDER PAGINATION STATE ================================ */ 
const ADMIN_ORDER_PAGE_SIZE = 10; 
let lastAdminOrderDoc = null; 
let adminOrdersEnded = false; 
/* ===============================
   ADMIN PRODUCT PAGINATION STATE (ADD-ON)
================================ */
let adminLastVisibleProduct = null;
let adminProductsEnded = false;
let adminProductsLoading = false;
// =============================== // PAGINATION STATE (SAFE ADD) // =============================== 
const PAGE_SIZE = 8; 
// products per page 
let lastVisibleProduct = null; 
let isLastPage = false; 
/* =============================== LOAD ADMIN ORDERS (PAGINATED) ================================ */ 
async function loadAdminOrders(reset = true) { 
    if (adminOrdersEnded && !reset) 
        return; 
    const ordersRef = collection(db, "orders"); 
    let q; 
    if (reset) {
         q = query(ordersRef, limit(ADMIN_ORDER_PAGE_SIZE)); 
         lastAdminOrderDoc = null; 
         adminOrdersEnded = false; 
    } else {
         q = query( ordersRef, startAfter(lastAdminOrderDoc), limit(ADMIN_ORDER_PAGE_SIZE) );
    } 
    const snap = await getDocs(q);
    if (snap.empty) { 
        isLastPage = true; 
        const btn = document.getElementById("loadMoreBtn"); 
        if (btn) btn.style.display = "none";
         return; 
        } 
        lastAdminOrderDoc = snap.docs[snap.docs.length - 1]; 
        const body = document.getElementById("adminOrders"); 
        if (!body) 
            return; 
        snap.docs.forEach(d => {
  const o = d.data();

  body.innerHTML += `
    <tr>
      <td>${o.customer?.name || "-"}</td>
      <td>${o.customer?.phone || "-"}</td>
      <td>₹${o.total || 0}</td>
      <td>${o.status || "Placed"}</td>
      <td>
        <button
          style="
            padding:6px 12px;
            border:none;
            border-radius:6px;
            background:#ef4444;
            color:white;
            cursor:pointer;
          "
          onclick="deleteOrder('${d.id}')"
        >
          Delete
        </button>
      </td>
    </tr>
  `;
});
}
/* =============================== ADMIN STATS (TOTAL ORDERS & REVENUE) ================================ */ 
    async function updateAdminStats() { 
        const snap = await getDocs(collection(db, "orders")); 
        let totalOrders = snap.size; 
        let totalRevenue = 0; 
        snap.docs.forEach(d => { 
            totalRevenue += d.data().total || 0; 
        }); 
        const totalOrdersEl = document.querySelector( "#adminDashboard p:nth-of-type(2) b" ); 
        const totalRevenueEl = document.querySelector( "#adminDashboard p:nth-of-type(3) b" ); 
        if (totalOrdersEl) totalOrdersEl.innerText = totalOrders; 
        if (totalRevenueEl) totalRevenueEl.innerText = totalRevenue; 
    } 
    /* =============================== ADMIN PRODUCT COUNT ================================ */ 
    async function updateAdminProductCount() { 
        const snap = await getDocs(collection(db, "products")); 
        const totalProductsEl = document.getElementById("adminTotalProducts"); 
        if (totalProductsEl) { 
            totalProductsEl.innerText = snap.size; 
        } 
    } 
    /* =============================== ADMIN DELETE ORDER (SAFE) ================================ */ 
    window.deleteOrder = async (orderId) => { 
        if (!confirm( "Delete this order?\n\nOnly delete AFTER delivery.\nThis cannot be undone." )) 
            return; 
        try { 
            await deleteDoc(doc(db, "orders", orderId)); 
            alert("✅ Order deleted successfully"); // 🔄 Refresh admin orders 
            const table = document.getElementById("adminOrders"); 
            if (table) table.innerHTML = ""; 
            lastAdminOrderDoc = null; 
            adminOrdersEnded = false; 
            loadAdminOrders(true); 
            updateAdminStats(); 
            updateAdminProductCount(); 
        } 
        catch (err) {
             console.error("DELETE ORDER ERROR:", err); 
             alert("❌ Failed to delete order"); 
            }
         };
 async function loadProductsFromFirestore() {
  const productsRef = collection(db, "products");
  const snap = await getDocs(productsRef);

  products = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  // 🔥 INIT INFINITE SCROLL
  activeFilteredProducts = products;
  renderInfiniteProducts(true);

  // Admin table refresh
  renderAdminProducts();
}
         
      /* ===============================
   LOAD ADMIN PRODUCTS (PAGINATED – SAFE)
================================ */

async function loadAdminProducts(reset = false) {
  if (adminProductsLoading || adminProductsEnded) return;

  adminProductsLoading = true;

  const productsRef = collection(db, "products");
  let q;

  if (reset) {
    q = query(productsRef, limit(PAGE_SIZE));
    adminLastVisibleProduct = null;
    adminProductsEnded = false;
    products = [];
  } else if (adminLastVisibleProduct) {
    q = query(
      productsRef,
      startAfter(adminLastVisibleProduct),
      limit(PAGE_SIZE)
    );
  } else {
    q = query(productsRef, limit(PAGE_SIZE));
  }

  const snap = await getDocs(q);

  if (snap.empty) {
    adminProductsEnded = true;
    adminProductsLoading = false;
    return;
  }

  adminLastVisibleProduct = snap.docs[snap.docs.length - 1];

  const newProducts = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));

  products = [...products, ...newProducts];
  renderAdminProducts();

  adminProductsLoading = false;
}

/* =============================== USER PRODUCTS ================================ */ 
function renderProducts(list) {
  const box = document.getElementById("product-list");
  if (!box) return;

  box.innerHTML = "";

  list.forEach(p => {
    const discount = p.discount || 0;
    const finalPrice = Math.round(
      p.price - (p.price * discount) / 100
    );

    box.innerHTML += `
      <div class="product">
        <img src="${p.image}">
        <h3>${p.name}</h3>

        ${
          discount
            ? `
              <p>
                <s>₹${p.price}</s>
                <b style="color:#16a34a; margin-left:6px;">
                  ₹${finalPrice}
                </b>
                <span
                  style="
                    color:red;
                    font-size:12px;
                    margin-left:6px;
                    vertical-align:middle;
                  "
                >
                  ${discount}% OFF
                </span>
              </p>
            `
            : `<p>₹${p.price}</p>`
        }

        <button onclick='addToCart(${JSON.stringify(p)})'>
          Add to Cart
        </button>
      </div>
    `;
  });
}
/* ===============================
   INFINITE SCROLL RENDER (HOME)
================================ */
function renderInfiniteProducts(reset = false) {
  const box = document.getElementById("product-list");
  if (!box) return;

  if (reset) {
    box.innerHTML = "";
    visibleCount = SCROLL_PAGE_SIZE;
  }

  const toShow = activeFilteredProducts.slice(0, visibleCount);

  box.innerHTML = "";

  toShow.forEach(p => {
    const discount = p.discount || 0;
    const finalPrice = Math.round(
      p.price - (p.price * discount) / 100
    );

    box.innerHTML += `
      <div class="product">
        <img src="${p.image}">
        <h3>${p.name}</h3>
        ${
          discount
            ? `<p><s>₹${p.price}</s>
               <b style="color:#16a34a;margin-left:6px;">₹${finalPrice}</b>
               <span style="color:red;font-size:12px;margin-left:6px;">
                 ${discount}% OFF
               </span></p>`
            : `<p>₹${p.price}</p>`
        }
        <button onclick='addToCart(${JSON.stringify(p)})'>
          Add to Cart
        </button>
      </div>
    `;
  });
}

/* =============================== ADMIN TABLE ================================ */ 
function renderAdminProducts() {
  const body = document.getElementById("adminProducts");
  if (!body) return;

  body.innerHTML = "";

  products.forEach(p => {
    body.innerHTML += `
      <tr>
        <td>
          <img src="${p.image}" width="50">
        </td>
        <td>${p.name}</td>
        <td>₹${p.price}</td>
        <td>${p.discount || 0}%</td>
        <td>
          <button class="edit-btn" onclick="editProduct('${p.id}')">
            Edit
          </button>
          <button class="delete-btn" onclick="deleteProduct('${p.id}')">
            Delete
          </button>
        </td>
      </tr>
    `;
  });
}
/* ===============================
   EDIT PRODUCT
================================ */
window.editProduct = (id) => {
  const product = products.find(p => p.id === id);
  if (!product) {
    alert("Product not found");
    return;
  }

  // store editing id
  editingProductId = id;

  // fill form with existing data
  document.getElementById("apName").value = product.name;
  document.getElementById("apPrice").value = product.price;
  document.getElementById("apDiscount").value = product.discount || 0;
  document.getElementById("apImage").value = product.image;
  document.getElementById("apType").value = product.type || "fish";

  // scroll to form
  document
    .querySelector(".admin-form")
    .scrollIntoView({ behavior: "smooth" });
};

/* ===============================
   DELETE PRODUCT
================================ */
window.deleteProduct = async (id) => {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    await deleteDoc(doc(db, "products", id));

    // reset editing state
    editingProductId = null;

    // clear form
    document.getElementById("apName").value = "";
    document.getElementById("apPrice").value = "";
    document.getElementById("apDiscount").value = "";
    document.getElementById("apImage").value = "";

    alert("✅ Product deleted");

    // reload products
    await loadProductsFromFirestore(true);

  } catch (err) {
    console.error("DELETE ERROR:", err);
    alert("❌ Failed to delete product");
  }
};
/* ===============================
   SAVE PRODUCT
================================ */
window.saveProduct = async () => {
  const apName = document.getElementById("apName");
  const apPrice = document.getElementById("apPrice");
  const apDiscount = document.getElementById("apDiscount");
  const apImage = document.getElementById("apImage");

  const data = {
    name: apName.value.trim(),
    price: Number(apPrice.value),
    discount: Number(apDiscount.value || 0),

    // 🔥 type stored but not shown anywhere
    type: document.getElementById("apType").value,

    image: apImage.value.trim(),
    updatedAt: serverTimestamp()
  };

  if (!data.name || !data.price || !data.type || !data.image) {
    alert("Fill all product fields");
    return;
  }

  try {
    if (editingProductId) {
      await updateDoc(
        doc(db, "products", editingProductId),
        data
      );
      editingProductId = null;
    } else {
      await addDoc(
        collection(db, "products"),
        data
      );
    }

    // reset form
    apName.value = "";
    apPrice.value = "";
    apDiscount.value = "";
    apImage.value = "";

    // reload products
    await loadProductsFromFirestore(true);

    alert("✅ Product saved successfully");

  } catch (err) {
    console.error("SAVE PRODUCT ERROR:", err);
    alert("❌ Failed to save product");
  }
};
/* ===============================
   CART LOGIC
================================ */

window.addToCart = (product) => {
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      ...product,
      qty: 1
    });
  }
  saveCart();
  updateCartCount();
};

function updateCartCount() {
  cartCount.innerText = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );
}
/* ===============================
   CART POPUP
================================ */

cartBtn.onclick = () => {
  renderCartPopup();
  cartPopup.style.display = "block";
};

function renderCartPopup() {
  cartItems.innerHTML = "";

  let payable = 0;
  let discountTotal = 0;

  cart.forEach(item => {
  const price = item.price;
  const qty = item.qty;
  const discount = item.discount || 0;

  // ✅ discount calculated FIRST
  const discountAmount = Math.round(
    (price * discount / 100) * qty
  );

  // ✅ final line total
  const lineTotal = Math.round(price * qty - discountAmount);

  payable += lineTotal;
  discountTotal += discountAmount;

    cartItems.innerHTML += `
      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:10px;
        "
      >
        <span>${item.name}</span>

        <div
          style="
            display:flex;
            align-items:center;
            gap:8px;
          "
        >
          <button onclick="decreaseQty('${item.id}')">−</button>
          <span>${item.qty}</span>
          <button onclick="increaseQty('${item.id}')">+</button>
        </div>

        <span>₹${lineTotal}</span>
      </div>
    `;
  });

  cartDiscountEl.innerText = discountTotal;
  cartPayableEl.innerText = payable;
}
/* ===============================
   QUANTITY CONTROLS
================================ */

window.increaseQty = (id) => {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty++;
  saveCart();
  renderCartPopup();
  updateCartCount();
};

window.decreaseQty = (id) => {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty--;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  renderCartPopup();
  updateCartCount();
};

/* ===============================
   CHECKOUT → ORDERS PAGE
================================ */

window.proceedCheckout = () => {
  cartPopup.style.display = "none";
  openOrders(); // 🔥 THIS WAS MISSING
};
/* ===============================
   LOAD USER ORDERS (REAL ECOMMERCE)
================================ */

async function loadUserOrders() {
  const box = document.getElementById("orderSummary");
  if (!box) return;

  box.innerHTML = "";

  const user = auth.currentUser;
  if (!user) return;

  // 🚫 BLOCK ADMIN COMPLETELY
  if (isAdminUser()) {
    box.innerHTML = `
      <p style="color:gray;">
        Order history is not available for admin accounts.
      </p>
    `;
    return;
  }

  const q = query(
    collection(db, "orders"),
    where("customer.email", "==", user.email)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    box.innerHTML = "<p>No orders found</p>";
    return;
  }

  snap.docs.forEach(docSnap => {
    const o = docSnap.data();
    const id = docSnap.id;

    // ❌ Hide cancelled orders
    if (o.status === "Cancelled") return;

    let itemsHtml = "";
    let idx = 1;

    (o.items || []).forEach(item => {
      const price = item.price;
      const qty = item.qty;
      const discount = item.discount || 0;

      const discountAmount = Math.round((price * discount / 100) * qty);
      const lineTotal = Math.round(price * qty - discountAmount);

      itemsHtml += `
        <div style="margin-bottom:12px;">
          <p style="margin:0;font-weight:600;">
            ${idx++}. ${item.name}
          </p>
          <p style="margin:2px 0;font-size:13px;">
            ₹${price} × ${qty}
          </p>
          ${
            discount
              ? `<p style="margin:2px 0;font-size:13px;color:#f87171;">
                   Discount: ${discount}% (−₹${discountAmount})
                 </p>`
              : ""
          }
          <p style="margin:2px 0;font-size:13px;color:#22c55e;">
            Line Total: ₹${lineTotal}
          </p>
        </div>
      `;
    });

    box.innerHTML += `
  <div class="order-card">

    <!-- ORDER HEADER -->
    <div class="order-header">
      <div class="order-id">
        <b>Order ID:</b> ${id}
      </div>

      <button
        class="invoice-btn"
       onclick='downloadInvoice({
    id: "${id}",
    items: ${JSON.stringify(o.items)},
    total: ${o.total},
    status: "${o.status}"
  })'
       >
        📄 Receipt
      </button>
    </div>
        <div class="order-items">
          <p><b>Order Summary:</b></p>
          ${itemsHtml}
        </div>

        <p><b>Total:</b> ₹${o.total}</p>
        <p><b>Status:</b> ${o.status}</p>

        <button onclick="cancelOrder('${id}')">Cancel Order</button>
      </div>
    `;
  });

  if (!box.innerHTML.trim()) {
    box.innerHTML = "<p>No active orders</p>";
  }
}

/* ===============================
   ORDERS PAGE (FINAL)
================================ */

window.openOrders = () => {
  hideAllMainSections();

  orders.style.display = "block";
  orders.classList.remove("fullscreen-section");
  activePage = "orders";

  loadUserOrders(); // ✅ IMPORTANT
};

/* ===============================
   PLACE ORDER (UNCHANGED – FIXED)
================================ */

window.placeOrder = async () => {
  if (!cart.length) {
    alert("Cart is empty");
    return;
  }

  const name = custName.value.trim();
  const phone = custPhone.value.trim();
  const email = custEmail.value.trim();
  const address = custAddress.value.trim();

  if (!name || !phone || !email || !address) {
    alert("Please fill all details");
    return;
  }

  let total = 0;
let orderText = "";

cart.forEach(i => {
  const price = i.price;
  const qty = i.qty;
  const discount = i.discount || 0;

  const discountAmount = Math.round(
    (price * discount / 100) * qty
  );

  const lineTotal = Math.round(price * qty - discountAmount);

  total += lineTotal; // ✅ ONLY SUM LINE TOTALS

  orderText += `${i.name} × ${qty} = ₹${lineTotal}\n`;
});

  const orderRef = await addDoc(collection(db, "orders"), {
    customer: {
      name,
      phone,
      email,
      address
    },
    items: cart,
    total,
    status: "Placed",
    createdAt: serverTimestamp()
  });

  await emailjs.send(EMAILJS_SERVICE_ID, ADMIN_TEMPLATE_ID, {
    to_email: ADMIN_EMAIL,
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    order_items: orderText,
    total_amount: `₹${total}`
  });

  // 🔥 Generate PDF for email attachment
const pdfBase64 = downloadInvoice(
  {
    id: orderRef.id,
    items: cart,
    total,
    status: "Placed"
  },
  true // autoEmail mode
);

  await emailjs.send(EMAILJS_SERVICE_ID, USER_TEMPLATE_ID, {
    to_email: email,
    customer_name: name,
    order_items: orderText,
    total_amount: `₹${total}`
  });

  alert("✅ Order placed successfully!");
 localStorage.setItem("last_order_id", orderRef.id);
  cart = [];
  localStorage.removeItem("wonder_cart");
  updateCartCount();
  openOrders();
};
/* ===============================
   ADMIN MODE – FIX
================================ */

window.toggleAdminMode = () => {
  adminMode = !adminMode;

  landing.style.display = "none";

  if (adminMode) {
    adminDashboard.style.display = "block";
    home.style.display = "none";
    orders.style.display = "none";

    adminSwitch.innerText = "Switch to User Mode";

    loadAdminOrders(true);
    loadAdminProducts(true); 
    updateAdminStats();
    updateAdminProductCount();
  } else {
    adminDashboard.style.display = "none";
    home.style.display = "block";
    activePage = null;
    adminSwitch.innerText = "Switch to Admin Mode";
  }
};
/* ===============================
   FILTER PRODUCTS – FIX
================================ */
window.filterProducts = (type) => {
  sidebar.classList.remove("open");

  if (type === "all") {
    activeFilteredProducts = products;
  } else {
    activeFilteredProducts = products.filter(p => p.type === type);
  }

  renderInfiniteProducts(true);
};
/* ===============================
   NAV & AUTH
================================ */

/* ===============================
   SHOW HOME – FIX
================================ */

window.showHome = () => {
  activePage = null;
  adminMode = false;

  landing.style.display = "none";
  home.style.display = "block";
  orders.style.display = "none";
  contact.style.display = "none";
  adminDashboard.style.display = "none";

  lastVisibleProduct = null;
  isLastPage = false;

  const btn = document.getElementById("loadMoreBtn");
  if (btn) btn.style.display = "none";

  adminSwitch.innerText = "Switch to Admin Mode";
  activeFilteredProducts = products;
  renderInfiniteProducts(true);
  sidebar.classList.remove("open");
};

/* ===============================
   UI TOGGLES
================================ */

hamburger.onclick = () => {
  sidebar.classList.toggle("open");
};

profileIcon.onclick = (e) => {
  e.stopPropagation();
  profileDropdown.style.display =
    profileDropdown.style.display === "block" ? "none" : "block";
};

document.addEventListener("click", (e) => {
  if (!profileDropdown.contains(e.target) && e.target !== profileIcon) {
    profileDropdown.style.display = "none";
  }
});

/* ===============================
   AUTH STATE
================================ */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    location.replace("login.html");
    return;
  }

  profileEmail.innerText = user.email;

  if (ADMIN_EMAILS.includes(user.email)) {
    adminSwitch.style.display = "block";
    adminSwitch.onclick = toggleAdminMode;
  } else {
    adminSwitch.style.display = "none";
  }
});

/* ===============================
   INITIAL LOAD
================================ */

document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromFirestore(true);
  loadCart();
});
/* ===============================
   INFINITE SCROLL LISTENER
================================ */
home.addEventListener("scroll", () => {
  if (
    home.scrollTop + home.clientHeight >=
    home.scrollHeight - 200
  ) {
    if (visibleCount < activeFilteredProducts.length) {
      visibleCount += SCROLL_PAGE_SIZE;
      renderInfiniteProducts(false);
    }
  }
});

/* ===============================
   LOGOUT – FIX
================================ */

window.logout = async () => {
  try {
    await auth.signOut();

    // 🔥 Redirect to login page
    window.location.href = "login.html";
  } catch (err) {
    console.error("Logout error:", err);
    alert("Failed to logout. Try again.");
  }
};

/* ===============================
   CONTACT PAGE TOGGLE
================================ */

window.showContact = () => {
  // 🔁 REAL TOGGLE LOGIC
  if (activePage === "contact") {
    showHome();
    return;
  }

  hideAllMainSections();

  contact.style.display = "block";
  contact.classList.add("fullscreen-section");
  activePage = "contact";

  sidebar.classList.remove("open");
  profileDropdown.style.display = "none";
  cartPopup.style.display = "none";
};

/* ===============================
   SEND CONTACT (WHATSAPP)
================================ */

window.sendContact = (e) => {
  e.preventDefault();

  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const message = document.getElementById("contactMessage").value.trim();

  if (!name || !email || !phone || !message) {
    alert("Please fill all contact details");
    return;
  }

  const whatsappText = `
Hello Wonder Pets & Aqua 👋

Name: ${name}
Email: ${email}
Phone: ${phone}

Message:
${message}
  `.trim();

  const whatsappURL =
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(whatsappText);

  window.open(whatsappURL, "_blank");
};
/* ===============================
   ORDER STATUS & CANCEL FEATURE
   (SAFE ADD-ON)
================================ */
window.cancelOrder = async (orderId) => {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  try {
    const orderRef = doc(db, "orders", orderId);
    const snap = await getDocs(
      query(collection(db, "orders"), where("__name__", "==", orderId))
    );

    if (snap.empty) {
      alert("Order not found");
      return;
    }

    const order = snap.docs[0].data();

    // ✅ Update order status
    await updateDoc(orderRef, {
      status: "Cancelled",
      cancelledAt: serverTimestamp()
    });

    // ✅ Send proper admin email with FULL customer details
    await emailjs.send(EMAILJS_SERVICE_ID, ADMIN_TEMPLATE_ID, {
      to_email: ADMIN_EMAIL,

      customer_name: order.customer?.name || "-",
      customer_phone: order.customer?.phone || "-",
      customer_address: order.customer?.address || "-",
      customer_email: order.customer?.email || "-",

      order_items: "❌ Order Cancelled by Customer",
      total_amount: "Cancelled"
    });

    alert("❌ Order cancelled successfully");
    loadUserOrders();

  } catch (err) {
    console.error("Cancel order error:", err);
    alert("Failed to cancel order");
  }
};

/* ===============================
   LOAD MORE PRODUCTS (PAGINATION)
================================ */
window.loadMoreAdminProducts = () => {
  loadAdminProducts(false);
};

/* ===============================
   CLIENT-SIDE SEARCH (ZERO READS)
================================ */
window.searchProducts = (text) => {
  const value = text.toLowerCase().trim();

  if (!value) {
    activeFilteredProducts = products;
    renderInfiniteProducts(true);
    return;
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(value)
  );

  activeFilteredProducts = filtered;
  renderInfiniteProducts(true);
};

window.downloadInvoice = (order) => {
  // jsPDF must already be loaded
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 20;

  // 🏪 Store Name
  doc.setFontSize(16);
  doc.text("Wonder Pets and Aqua", 20, y);
  y += 10;

  // 🕒 Date & Time
  doc.setFontSize(10);
  doc.text(`Date & Time: ${getFormattedDateTime()}`, 20, y);
  y += 10;

  // 🆔 Order ID (ONLY ONCE)
  doc.setFontSize(11);
  doc.text(`Order ID: ${order.id}`, 20, y);
  y += 10;

  // 📦 Order Summary
  doc.setFontSize(13);
  doc.text("Order Summary:", 20, y);
  y += 8;

  doc.setFontSize(11);

  order.items.forEach((item, index) => {
    const price = item.price;
    const qty = item.qty;
    const discount = item.discount || 0;

    const discountAmount = Math.round(
      (price * discount / 100) * qty
    );
    const lineTotal = Math.round(price * qty - discountAmount);

    doc.text(
      `${index + 1}. ${item.name}`,
      20,
      y
    );
    y += 6;

    doc.text(
      `   Rs.${price} x ${qty}`,
      20,
      y
    );
    y += 6;

    if (discount > 0) {
      doc.text(
        `   Discount: ${discount}% (-Rs.${discountAmount})`,
        20,
        y
      );
      y += 6;
    }

    doc.text(
      `   Line Total: Rs.${lineTotal}`,
      20,
      y
    );
    y += 8;
  });

  // 💰 Total
  y += 4;
  doc.setFontSize(12);
  doc.text(`Total Amount: Rs.${order.total}`, 20, y);
  y += 8;

  // 📌 Status
  doc.setFontSize(11);
  doc.text(`Status: ${order.status}`, 20, y);

  // ⬇ Download
  doc.save(`Order_${order.id}.pdf`);
};
