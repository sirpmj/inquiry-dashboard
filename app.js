// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCuPj2Zayn-b-USaCoC3d_eA0FALPrBqXg",
  authDomain: "inquiry-pool-dashboard.firebaseapp.com",
  projectId: "inquiry-pool-dashboard",
  storageBucket: "inquiry-pool-dashboard.firebasestorage.app",
  messagingSenderId: "722727372065",
  appId: "1:722727372065:web:03302e83335325885dea60"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = firebase.firestore();

// ---------- LOAD PRODUCTS ----------
function loadProducts() {
  const productSelect = document.getElementById("product");
  db.collection("products").orderBy("createdAt","asc").onSnapshot(snap=>{
    productSelect.innerHTML="<option value=''>Select Product</option>";
    snap.forEach(doc=>{
      productSelect.innerHTML+=`<option>${doc.id}</option>`;
    });
  });
}
loadProducts();

// ---------- ADD PRODUCT ----------
function addProduct() {
  const p = document.getElementById("newProduct").value.trim();
  if(!p) return;
  db.collection("products").doc(p).set({name:p,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  document.getElementById("newProduct").value="";
}

// ---------- LOGIN ----------
let currentUser = localStorage.getItem("salesman");
function login() {
  const nameInput = document.getElementById("name").value.trim();
  if(!nameInput) return alert("Enter name");
  localStorage.setItem("salesman",nameInput);
  currentUser=nameInput;
  showUser();
}
function showUser() {
  if(currentUser){
    document.getElementById("loginBox").style.display="none";
    document.getElementById("userBox").style.display="block";
    document.getElementById("userName").innerText=currentUser;
  }
}
showUser();

// ---------- LOGOUT ----------
function logout(){
  localStorage.removeItem("salesman");
  currentUser=null;
  document.getElementById("loginBox").style.display="block";
  document.getElementById("userBox").style.display="none";
}

// ---------- ADD / UPDATE INQUIRY ----------
let editId=null;
function addInquiry(){
  if(!currentUser) return alert("Login first");
  const data={
    date:new Date().toLocaleDateString(),
    product:document.getElementById("product").value,
    category:document.getElementById("category").value,
    qty:Number(document.getElementById("qty").value),
    party:document.getElementById("party").value,
    rate:document.getElementById("rate").value,
    availableWith:document.getElementById("availableWith").value,
    salesman:currentUser,
    remark:document.getElementById("remark").value,
    status:"Open",
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  };
  if(!data.product) return alert("Select product");
  if(editId){db.collection("inquiries").doc(editId).update(data); editId=null;}
  else db.collection("inquiries").add(data);
  document.getElementById("qty").value="";
  document.getElementById("party").value="";
  document.getElementById("rate").value="";
  document.getElementById("availableWith").value="";
  document.getElementById("remark").value="";
  document.getElementById("product").value="";
}

// ---------- DELETE ----------
function deleteRow(id){if(confirm("Delete this entry?")) db.collection("inquiries").doc(id).delete();}

// ---------- EDIT ----------
function editRow(id,d){
  editId=id;
  document.getElementById("product").value=d.product;
  document.getElementById("category").value=d.category;
  document.getElementById("qty").value=d.qty;
  document.getElementById("party").value=d.party;
  document.getElementById("rate").value=d.rate;
  document.getElementById("availableWith").value=d.availableWith;
  document.getElementById("remark").value=d.remark;
}

// ---------- STATUS TOGGLE ----------
function toggleStatus(id,currentStatus){
  const nextStatus=currentStatus==="Open"?"Matched":currentStatus==="Matched"?"Closed":"Open";
  db.collection("inquiries").doc(id).update({status:nextStatus});
}

// ---------- FILTER ----------
let currentFilter="";
let currentSalesmanFilter="";
function filterByProduct(productName){
  if(currentFilter===productName.toLowerCase()) currentFilter="";
  else currentFilter=productName.toLowerCase();
  updateTable();
}
function filterBySalesman(salesman){
  if(currentSalesmanFilter===salesman) currentSalesmanFilter="";
  else currentSalesmanFilter=salesman;
  updateTable();
}

// ---------- LIVE TABLE + TOTALS + REPORT ----------
function updateTable(){
  db.collection("inquiries").orderBy("createdAt","desc").get().then(snapshot=>{
    const tbody=document.getElementById("data");
    const totalsDiv=document.getElementById("totals");
    const reportBox=document.getElementById("reportBox");
    const search=document.getElementById("search").value.toLowerCase();

    tbody.innerHTML="";
    totalsDiv.innerHTML="";

    let totals={};
    let salesmanTotals={};

    snapshot.forEach(doc=>{
      const d=doc.data();
      if((search && !d.product.toLowerCase().includes(search)) ||
         (currentFilter && d.product.toLowerCase()!==currentFilter) ||
         (currentSalesmanFilter && d.salesman!==currentSalesmanFilter)) return;

      totals[d.product]=(totals[d.product]||0)+d.qty;
      salesmanTotals[d.salesman]=(salesmanTotals[d.salesman]||0)+d.qty;

      tbody.innerHTML+=`
        <tr class="status-${d.status}">
          <td>${d.date}</td>
          <td>${d.product}</td>
          <td>${d.qty}</td>
          <td>${d.party}</td>
          <td>${d.availableWith}</td>
          <td>${d.salesman}</td>
          <td class="actionIcons">
            <span title="Edit" onclick='editRow("${doc.id}", ${JSON.stringify(d)})'>✏️</span>
            <span title="Delete" onclick="deleteRow('${doc.id}')">🗑️</span>
            <span title="Toggle Status" onclick="toggleStatus('${doc.id}','${d.status}')">🔄</span>
          </td>
        </tr>`;
    });

    // Product totals clickable
    for(let p in totals) totalsDiv.innerHTML+=`<div class="qtyItem" onclick="filterByProduct('${p}')">${p}: <b>${totals[p]}</b></div>`;

    // Salesman report clickable
    let reportHTML="";
    for(let s in salesmanTotals) reportHTML+=`<div class="qtyItem" onclick="filterBySalesman('${s}')">${s}: <b>${salesmanTotals[s]}</b></div>`;
    reportBox.innerHTML=reportHTML;
  });
}

db.collection("inquiries").orderBy("createdAt","desc").onSnapshot(()=>updateTable());
document.getElementById("search").addEventListener("input",()=>updateTable());
