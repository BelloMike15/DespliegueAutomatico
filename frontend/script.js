// Tienda MikeTech S.A - Frontend (sin exponer tokens de PayPhone)
// IVA Ecuador (12%)
const IVA_RATE = 0.12;

const products = [
  { id: "p1", name: "Laptop Lenovo i5", price: 800.00, image: "img/laptop.jpg" },
  { id: "p2", name: "Smartphone Samsung A54", price: 450.00, image: "img/smartphone.jpg" },
  { id: "p3", name: "Audífonos Bluetooth", price: 55.00, image: "img/audifonos.jpg" },
  { id: "p4", name: "Mouse inalámbrico", price: 25.00, image: "img/mouse.jpg" },
  { id: "p5", name: "Teclado mecánico", price: 60.00, image: "img/teclado.jpg" },
  { id: "p6", name: "Smartwatch Huawei", price: 120.00, image: "img/Smartwatch_Huawei.png" },
  { id: "p7", name: "Impresora Epson", price: 210.00, image: "img/impresora_epson.png" },
  { id: "p8", name: "Micrófono Gamer", price: 65.00, image: "img/microfono_gamer.png" },
  { id: "p9", name: "Cámara Gamer", price: 75.00, image: "img/camara_gamer.png" },
  { id: "p10", name: "Mouse Gamer", price: 35.00, image: "img/mouse_gamer.png" }
];

let cart = []; // {id, name, price, image, qty}

// -------------------- UI Helpers --------------------
const $ = (id) => document.getElementById(id);

function money(n){
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n);
}

function setYear(){
  const y = new Date().getFullYear();
  const el = $("year");
  if (el) el.textContent = y;
}

function openDrawer(){
  $("drawer").classList.add("drawer--open");
  $("drawer").setAttribute("aria-hidden", "false");
  $("drawerBackdrop").hidden = false;
}

function closeDrawer(){
  $("drawer").classList.remove("drawer--open");
  $("drawer").setAttribute("aria-hidden", "true");
  $("drawerBackdrop").hidden = true;
}

// -------------------- Render Products --------------------
function renderProducts(filterText = ""){
  const grid = $("productGrid");
  grid.innerHTML = "";

  const ft = filterText.trim().toLowerCase();

  const filtered = products.filter(p => p.name.toLowerCase().includes(ft));

  if (filtered.length === 0){
    grid.innerHTML = `<div class="card" style="padding:14px;">No se encontraron productos.</div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img class="card__img" src="${p.image}" alt="${p.name}">
      <div class="card__body">
        <div class="card__title">${p.name}</div>
        <div class="card__meta">
          <span class="price">${money(p.price)}</span>
          <span>En stock</span>
        </div>
        <div class="btnRow">
          <button class="btn btn--primary" type="button" data-add="${p.id}">Agregar</button>
          <button class="btn btn--ghost" type="button" data-buy="${p.id}">Comprar</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // Bind add/buy
  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.getAttribute("data-add")));
  });
  grid.querySelectorAll("[data-buy]").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.getAttribute("data-buy"));
      openDrawer();
    });
  });
}

// -------------------- Cart Logic --------------------
function addToCart(productId){
  const p = products.find(x => x.id === productId);
  if (!p) return;

  const existing = cart.find(x => x.id === productId);
  if (existing) existing.qty += 1;
  else cart.push({ ...p, qty: 1 });

  updateCartUI();
}

function changeQty(productId, delta){
  const item = cart.find(x => x.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0){
    cart = cart.filter(x => x.id !== productId);
  }
  updateCartUI();
}

function clearCart(){
  cart = [];
  updateCartUI();
}
//hola
function totals(){
  const subtotal = cart.reduce((s, it) => s + (it.price * it.qty), 0);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;

  return { subtotal, iva, total };
}

function updateCartUI(){
  const list = $("cartList");
  const count = cart.reduce((s,it)=>s+it.qty,0);

  $("cartCount").textContent = count;
  $("cartSubtitle").textContent = `${count} artículo${count === 1 ? "" : "s"}`;

  if (cart.length === 0){
    list.innerHTML = `<div style="color:rgba(255,255,255,.65);">Tu carrito está vacío.</div>`;
  } else {
    list.innerHTML = "";
    cart.forEach(it => {
      const row = document.createElement("div");
      row.className = "cartItem";
      row.innerHTML = `
        <img src="${it.image}" alt="${it.name}">
        <div>
          <div class="cartItem__name">${it.name}</div>
          <div class="cartItem__price">${money(it.price)} • x${it.qty}</div>
        </div>
        <div class="qty" aria-label="Cantidad">
          <button type="button" aria-label="Disminuir" data-minus="${it.id}">−</button>
          <span>${it.qty}</span>
          <button type="button" aria-label="Aumentar" data-plus="${it.id}">+</button>
        </div>
      `;
      list.appendChild(row);
    });

    list.querySelectorAll("[data-minus]").forEach(b => b.addEventListener("click", ()=>changeQty(b.getAttribute("data-minus"), -1)));
    list.querySelectorAll("[data-plus]").forEach(b => b.addEventListener("click", ()=>changeQty(b.getAttribute("data-plus"), +1)));
  }

  const t = totals();
  $("subtotal").textContent = money(t.subtotal);
  $("iva").textContent = money(t.iva);
  $("total").textContent = money(t.total);
}

// -------------------- PayPhone (vía backend) --------------------
async function payWithPayPhone(){
  const t = totals();
  if (t.total <= 0){
    alert("El carrito está vacío. Agrega productos antes de pagar.");
    return;
  }

  // PayPhone recibe montos en centavos (enteros)
  const subtotalCents = Math.round(t.subtotal * 100);
  const ivaCents = Math.round(t.iva * 100);
  const totalCents = Math.round(t.total * 100);

  const clientTransactionId = `MIKETECH-${Date.now()}`;

  const payload = {
    amount: totalCents,
    amountWithoutTax: subtotalCents,  // en este ejemplo tratamos todo como "sin impuestos" y el IVA como "tax"
    amountWithTax: 0,
    tax: ivaCents,
    clientTransactionId,
    reference: "Compra en Tienda MikeTech S.A",
    items: cart.map(it => ({
      productName: it.name,
      unitPrice: Math.round(it.price * 100),
      quantity: it.qty,
      totalAmount: Math.round(it.price * it.qty * 100),
      taxAmount: Math.round(it.price * it.qty * IVA_RATE * 100),
      productSKU: it.id,
      productDescription: "Producto de tecnología"
    }))
  };

  try{
    const res = await fetch("/api/payphone/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok){
      console.error("PayPhone prepare error:", data);
      alert(data?.message || "No se pudo preparar el pago.");
      return;
    }

    // Enlace recomendado: abrir en nueva pestaña (no embebido)
    const url = data?.payWithPayPhone || data?.payWithCard || data?.paymentURL || data?.url;
    if (!url){
      console.log("Respuesta prepare:", data);
      alert("No se recibió URL de pago. Revisa la consola.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  } catch(err){
    console.error(err);
    alert("Error iniciando pago (revisa consola).");
  }
}

// -------------------- Events --------------------
document.addEventListener("DOMContentLoaded", () => {
  setYear();

  renderProducts();
  updateCartUI();

  $("openCart").addEventListener("click", openDrawer);
  $("closeCart").addEventListener("click", closeDrawer);
  $("drawerBackdrop").addEventListener("click", closeDrawer);

  $("clearCart").addEventListener("click", clearCart);
  $("payButton").addEventListener("click", payWithPayPhone);

  $("searchInput").addEventListener("input", (e) => renderProducts(e.target.value));
});
