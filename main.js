import { auth, db, storage } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

let currentUser = null;
let logoUrl = null;
const authArea = document.getElementById("authArea");

function renderAuthUI(){
  authArea.innerHTML="";
  if(currentUser){
    const span=document.createElement("div");
    span.className="userBadge";
    span.textContent=currentUser.email;
    const btnLogout=document.createElement("button");
    btnLogout.className="btn secondary";
    btnLogout.style.marginLeft="8px";
    btnLogout.textContent="Logout";
    btnLogout.onclick=async()=>{await signOut(auth);};
    authArea.appendChild(span); authArea.appendChild(btnLogout);
  } else {
    const btnLogin=document.createElement("button");
    btnLogin.className="btn";
    btnLogin.textContent="Login / Register";
    btnLogin.onclick=showAuthModal;
    authArea.appendChild(btnLogin);
  }
}

function showAuthModal(){/* same modal logic as described before */}

onAuthStateChanged(auth,user=>{currentUser=user; renderAuthUI(); if(user) loadInvoices();});

// Invoice editor
const itemsTable=document.getElementById("itemsTable").querySelector("tbody");
const invNumberInput=document.getElementById("invNumber");
const invDateInput=document.getElementById("invDate");
const subtotalEl=document.getElementById("subtotal");
const taxEl=document.getElementById("tax");
const grandTotalEl=document.getElementById("grandTotal");

function addItemRow(name="",qty=1,price=0){
  const tr=document.createElement("tr");
  tr.innerHTML=`<td><input class="input itemName" value="${name}"></td>
  <td><input type="number" min="0" class="input itemQty" value="${qty}"></td>
  <td><input type="number" min="0" step="0.01" class="input itemPrice" value="${price}"></td>
  <td class="itemTotal">0.00 €</td>
  <td><button class="btn secondary remove">X</button></td>`;
  itemsTable.appendChild(tr);
  tr.querySelectorAll("input").forEach(i=>i.addEventListener("input",updateTotals));
  tr.querySelector(".remove").onclick=()=>{tr.remove();updateTotals();};
  updateTotals();
}

function updateTotals(){
  let subtotal=0;
  itemsTable.querySelectorAll("tr").forEach(r=>{
    const qty=parseFloat(r.querySelector(".itemQty").value)||0;
    const price=parseFloat(r.querySelector(".itemPrice").value)||0;
    const total=qty*price;
    r.querySelector(".itemTotal").textContent=total.toFixed(2)+" €";
    subtotal+=total;
  });
  const tax=subtotal*0.18;
  subtotalEl.textContent=subtotal.toFixed(2)+" €";
  taxEl.textContent=tax.toFixed(2)+" €";
  grandTotalEl.textContent=(subtotal+tax).toFixed(2)+" €";
}

document.getElementById("addItem").onclick=()=>addItemRow();
document.getElementById("saveInv").onclick=async()=>{/* save logic as described */};
document.getElementById("uploadLogo").onclick=async()=>{/* upload logo logic */};
function loadInvoices(){/* load invoices logic */}
addItemRow();
