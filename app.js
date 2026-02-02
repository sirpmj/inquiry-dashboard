// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCuPj2Zayn-b-USaCoC3d_eA0FALPrBqXg",
  authDomain: "inquiry-pool-dashboard.firebaseapp.com",
  projectId: "inquiry-pool-dashboard",
  storageBucket: "inquiry-pool-dashboard.appspot.com",
  messagingSenderId: "722727372065",
  appId: "1:722727372065:web:03302e83335325885dea60"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ---------- GLOBAL ----------
let editId = null;
let currentFilter = "";
let currentSalesmanFilter = "";

// ---------- AUTH STATE ----------
auth.onAuthStateChanged(user => {
  if(user){
    document.getElementById("authCard").style.display = "none";
    document.getElementById("userCard").style.display = "block";
    document.getElementById("totalsCard").style.display = "block";
    document.getElementById("reportCard").style.display = "block";
    document.getElementById("inquiryCard").style.display = "block";
    document.getElementById("tableCard").style.display = "block";
    document.getElementById("userName").innerText = user.email;
    updateTable();
  } else {
    document.getElementById("authCard").style.display = "block";
    document.getElementById("userCard").style.display = "none";
    document.getElementById("totalsCard").style.display = "none";
    document.getElementById("reportCard").style.display = "none";
    document.getElementById("inquiryCard").style.display = "none";
    document.getElementById("tableCard").style.display = "none";
  }
});

// ---------- SIGNUP ----------
function signup(){
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;
  if(!email || !pass) return alert("Enter email & password");
  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => alert("Signup successful!"))
    .catch(err => alert(err.message));
}

// ---------- LOGIN ----------
function login(){
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;
  if(!email || !pass) return alert("Enter email & password");
  auth.signInWithEmailAndPassword(email, pass)
    .catch(err => alert(err.message));
}

// ---------- LOGOUT ----------
function logout(){ auth.signOut(); }

// ---------- PRODUCTS ----------
function loadProducts(){
  const productSelect = document.getElementById("product");
  db.collection("products").orderBy("createdAt","asc").onSnapshot(snap => {
    productSelect.innerHTML = "<option value=''>Select Product</option>";
    snap.forEach(doc=>{
      productSelect.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
    });
  });
}
loadProducts();

function addProduct(){
  const p = document.getElementById("newProduct").value.trim();
  if(!p) return alert("Enter product name");
  db.collection("products").doc(p).set({
    name:p,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("newProduct").value="";
}

// ---------- ADD / UPDATE INQUIRY ----------
function addInquiry(){
  const user = auth.currentUser;
  if(!user) return alert("Login first");

  const data = {
    date: new Date().toLocaleDateString(),
    product: document.getElementById("product").value,
    category: document.getElementById("category").value,
    qty: Number(document.getElementById("qty").value),
    party: document.getElementById("party").value,
    rate: document.getElementById("rate").value,
    availableWith: document.getElementById("availableWith").value,
    salesman: user.email,
    remark: document.getElementById("remark").value,
    status: "Open",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if(!data.product) return alert("Select product");

  if(editId){
    db.collection("inquiries").doc(editId).update(data);
    editId = null;
  } else db.collection("inquiries").add(data);

  ["qty","party","rate","availableWith","remark","product"].forEach(id => document.getElementById(id).value="");
}

// ---------- DELETE ----------
function deleteRow(id){ if(confirm("Delete this entry?")) db.collection("inquiries").doc(id).delete(); }

// ---------- EDIT ----------
function editRow(id,d){
  editId=id;
  ["product","category","qty","party","rate","availableWith","remark"].forEach(f=>document.getElementById(f).value=d[f]);
}

// ---------- TOGGLE STATUS ----------
function toggleStatus(id,currentStatus){
  const nextStatus=currentStatus==="Open"?"Matched":currentStatus==="Matched"?"Closed":"Open";
  db.collection("inquiries").doc(id).update({status:nextStatus});
}

// ---------- FILTER ----------
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

// ---------- TABLE & TOTALS ----------
function updateTable(){
  db.collection("inquiries").orderBy("createdAt","desc").get().then(snapshot=>{
    const tbody = document.getElementById("data");
    const totalsDiv = document.getElementById("totals");
    const reportBox = document.getElementById("reportBox");
    const searchTerm = document.getElementById("search").value.toLowerCase();

    tbody.innerHTML = "";
    totalsDiv.innerHTML = "";
    reportBox.innerHTML = "";

    let totals = {};
    let salesmanTotals = {};

    snapshot.forEach(doc=>{
      const d = doc.data();
      if((searchTerm && !d.product.toLowerCase().includes(searchTerm)) ||
         (currentFilter && d.product.toLowerCase()!==currentFilter) ||
         (currentSalesmanFilter && d.salesman!==currentSalesmanFilter)) return;

      totals[d.product]=(totals[d.product]||0)+d.qty;
      salesmanTotals[d.salesman]=(salesmanTotals[d.salesman]||0)+d.qty;

      tbody.innerHTML += `<tr class="status-${d.status}">
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

    for(let p in totals) totalsDiv.innerHTML += `<div class="qtyItem" onclick="filterByProduct('${p}')">${p}: <b>${totals[p]}</b></div>`;
    for(let s in salesmanTotals) reportBox.innerHTML += `<div class="qtyItem" onclick="filterBySalesman('${s}')">${s}: <b>${salesmanTotals[s]}</b></div>`;
  });
}

db.collection("inquiries").orderBy("createdAt","desc").onSnapshot(()=>updateTable());
document.getElementById("search").addEventListener("input",()=>updateTable());
