import { auth, db, storage } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import { 
  collection, addDoc, getDocs, query, orderBy 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { 
  ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

let currentUser = null;
let logoUrl = null;

// Elements
const authArea = document.getElementById("authArea");
const itemsTable = document.querySelector("#itemsTable tbody");
const invNumberInput = document.getElementById("invNumber");
const invDateInput = document.getElementById("invDate");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const grandTotalEl = document.getElementById("grandTotal");
const invoicesList = document.getElementById("invoicesList");
const logoInput = document.getElementById("logoInput");

// ---------------- Auth ----------------
function renderAuthUI(){
  authArea.innerHTML="";
  if(currentUser){
    const span = document.createElement("div");
    span.className = "userBadge";
    span.textContent = currentUser.email;

    const btnLogout = document.createElement("button");
    btnLogout.className = "btn secondary";
    btnLogout.style.marginLeft = "8px";
    btnLogout.textContent = "Logout";
    btnLogout.onclick = async () => { await signOut(auth); };

    authArea.appendChild(span);
    authArea.appendChild(btnLogout);
  } else {
    const btnLogin = document.createElement("button");
    btnLogin.className = "btn";
    btnLogin.textContent = "Login / Register";
    btnLogin.onclick = showAuthModal;
    authArea.appendChild(btnLogin);
  }
}

function showAuthModal(){
  if(document.getElementById('authBackdrop')) return;

  const modal = document.createElement("div");
  modal.id = "authBackdrop";
  modal.className = "modal-backdrop";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";

  const box = document.createElement("div");
  box.className = "modal-box";
  box.innerHTML = `
    <h3>Login or Register</h3>
    <input id="authEmail" class="input" placeholder="Email">
    <input id="authPass" class="input" type="password" placeholder="Password">
    <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
      <button id="btnLogin" class="btn secondary">Login</button>
      <button id="btnRegister" class="btn">Register</button>
    </div>
  `;
  modal.appendChild(box);
  modal.addEventListener('click', (e)=>{ if(e.target===modal){ modal.remove(); } });
  document.body.appendChild(modal);

  document.getElementById("btnRegister").onclick = async () => {
    const email = document.getElementById("authEmail").value.trim();
    const pass = document.getElementById("authPass").value;
    if(!email || !pass){ alert("Enter email and password"); return; }
    try {
      await createUserWithEmailAndPassword(auth,email,pass);
      modal.remove();
    } catch(e){ alert(e.message); }
  };

  document.getElementById("btnLogin").onclick = async () => {
    const email = document.getElementById("authEmail").value.trim();
    const pass = document.getElementById("authPass").value;
    if(!email || !pass){ alert("Enter email and password"); return; }
    try {
      await signInWithEmailAndPassword(auth,email,pass);
      modal.remove();
    } catch(e){ alert(e.message); }
  };
}

onAuthStateChanged(auth, user => {
  currentUser = user;
  renderAuthUI();
  if(user) loadInvoices();
});

// ---------------- Invoice Editor ----------------
function addItemRow(name="",qty=1,price=0){
  const tr=document.createElement("tr");
  tr.innerHTML = `
    <td><input class="input itemName" value="${name}" placeholder="Description"></td>
    <td><input type="number" min="0" class="input itemQty" value="${qty}"></td>
    <td><input type="number" min="0" step="0.01" class="input itemPrice" value="${price}"></td>
    <td class="itemTotal">0.00 €</td>
    <td><button class="btn secondary remove">X</button></td>`;
  itemsTable.appendChild(tr);

  tr.querySelectorAll("input").forEach(i=>i.addEventListener("input",updateTotals));
  tr.querySelector(".remove").onclick = ()=>{ tr.remove(); updateTotals(); };
  updateTotals();
}

function updateTotals(){
  let subtotal=0;
  itemsTable.querySelectorAll("tr").forEach(r=>{
    const qty=parseFloat(r.querySelector(".itemQty").value)||0;
    const price=parseFloat(r.querySelector(".itemPrice").value)||0;
    const total = qty*price;
    r.querySelector(".itemTotal").textContent = total.toFixed(2)+" €";
    subtotal+=total;
  });
  const tax = subtotal*0.18;
  subtotalEl.textContent = subtotal.toFixed(2)+" €";
  taxEl.textContent = tax.toFixed(2)+" €";
  grandTotalEl.textContent = (subtotal+tax).toFixed(2)+" €";
}

document.getElementById("addItem").onclick = ()=>addItemRow();

// ---------------- Logo Upload ----------------
document.getElementById("uploadLogo").onclick = async () => {
  if(!logoInput.files[0]){ alert("Select a logo first"); return; }
  const file = logoInput.files[0];
  const storageRef = ref(storage, `logos/${currentUser.uid}.png`);
  await uploadBytes(storageRef,file);
  logoUrl = await getDownloadURL(storageRef);
  alert("Logo uploaded");
};

// ---------------- Save Invoice ----------------
document.getElementById("saveInv").onclick = async () => {
  if(!currentUser){ alert("Please login first"); showAuthModal(); return; }
  if(itemsTable.querySelectorAll("tr").length===0){ alert("Add at least one item"); return; }

  const items = [];
  itemsTable.querySelectorAll("tr").forEach(r=>{
    items.push({
      name: r.querySelector(".itemName").value || "",
      qty: parseFloat(r.querySelector(".itemQty").value)||0,
      price: parseFloat(r.querySelector(".itemPrice").value)||0,
      total: parseFloat(r.querySelector(".itemTotal").textContent.replace("€","").trim())||0
    });
  });

  const invoice = {
    invNumber: invNumberInput.value.trim() || "INV-"+Date.now(),
    invDate: invDateInput.value || new Date().toISOString().slice(0,10),
    items,
    creator: currentUser.email,
    logoUrl,
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db,"invoices"),invoice);
    alert("Invoice saved!");
    clearEditor();
    loadInvoices();
  } catch(e){ alert(e.message); }
};

function clearEditor(){
  invNumberInput.value="";
  invDateInput.value="";
  itemsTable.innerHTML="";
  addItemRow();
  updateTotals();
}

// ---------------- Load Invoices ----------------
async function loadInvoices(){
  invoicesList.innerHTML="";
  const q = query(collection(db,"invoices"), orderBy("createdAt","desc"));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc=>{
    const inv = doc.data();
    const div = document.createElement("div");
    div.className="invoice-card";
    div.innerHTML = `
      <div><strong>${inv.invNumber}</strong> • ${inv.invDate} • ${inv.creator}</div>
      <button class="btn secondary view">View</button>`;
    div.querySelector(".view").onclick = ()=>{
      invNumberInput.value = inv.invNumber;
      invDateInput.value = inv.invDate;
      itemsTable.innerHTML="";
      inv.items.forEach(it=>addItemRow(it.name,it.qty,it.price));
      updateTotals();
    };
    invoicesList.appendChild(div);
  });
}

// ---------------- Init ----------------
addItemRow();
updateTotals();
renderAuthUI();
