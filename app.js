/*
 * Elite Store checkout frontend.
 * Package IDs and amounts are validated again by the backend.
 * Never put Razorpay secrets or supplier API keys in this file.
 */
const PACKAGES = [
  { id:"p1", amount:"100", label:"Diamonds", price:"₹80", amountPaise:8000, badge:"", featured:false },
  { id:"p2", amount:"310", label:"Diamonds", price:"₹240", amountPaise:24000, badge:"POPULAR", featured:true },
  { id:"p3", amount:"520", label:"Diamonds", price:"₹390", amountPaise:39000, badge:"", featured:false },
  { id:"p4", amount:"1060", label:"Diamonds", price:"₹780", amountPaise:78000, badge:"BEST VALUE", featured:false },
  { id:"p5", amount:"2180", label:"Diamonds", price:"₹1,550", amountPaise:155000, badge:"", featured:false },
  { id:"p6", amount:"5600", label:"Diamonds", price:"₹3,900", amountPaise:390000, badge:"ELITE", featured:true },
  { id:"p7", amount:"Weekly", label:"Membership", price:"₹160", amountPaise:16000, badge:"", featured:false },
  { id:"p8", amount:"Monthly", label:"Membership", price:"₹650", amountPaise:65000, badge:"", featured:false }
];
const diamondSVG = `<svg viewBox="0 0 60 70" aria-hidden="true"><defs><linearGradient id="miniGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b4faff"/><stop offset=".5" stop-color="#788cff"/><stop offset="1" stop-color="#6742e8"/></linearGradient></defs><path d="M14 3h32l12 18L30 67 2 21Z" fill="url(#miniGrad)" stroke="#c9fbff" stroke-width="1.2"/><path d="M2 21h56M14 3l7 18 9 46M46 3l-7 18-9 46M14 3l7 18h18l7-18" fill="none" stroke="#e2ffff" stroke-width="1.1" opacity=".8"/></svg>`;
const grid = document.getElementById("packageGrid");
const select = document.getElementById("selectedPackage");
const status = document.getElementById("formMessage");

function renderPackages(){
  grid.innerHTML = PACKAGES.map(p => `<article class="package-card ${p.featured ? "featured" : ""}">
    ${p.badge ? `<span class="tag">${p.badge}</span>` : ""}
    <div class="pack-visual"><div class="mini-diamond">${diamondSVG}</div></div>
    <div class="pack-amount">${p.amount}</div><div class="pack-label">${p.label}</div>
    <div class="pack-price"><strong>${p.price}</strong><span> / pack</span></div>
    <button class="pack-action" type="button" data-package="${p.id}">Choose Package <span>→</span></button>
  </article>`).join("");
  select.innerHTML = `<option value="">Select a package</option>` + PACKAGES.map(p=>`<option value="${p.id}">${p.amount} ${p.label} — ${p.price}</option>`).join("");
}
renderPackages();
grid.addEventListener("click", e => {
  const button = e.target.closest("[data-package]");
  if (!button) return;
  select.value = button.dataset.package;
  document.getElementById("order").scrollIntoView({behavior:"smooth"});
  document.getElementById("playerId").focus({preventScroll:true});
});

document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();
  const p = PACKAGES.find(item => item.id === select.value);
  const playerId = document.getElementById("playerId").value.trim();
  const region = document.getElementById("region").value;
  const button = e.submitter;
  if (!p) { status.textContent = "Please select a package."; return; }
  if (!/^[0-9]{5,20}$/.test(playerId)) { status.textContent = "Enter a valid numeric Player ID."; return; }

  button.disabled = true;
  button.textContent = "Creating secure order…";
  status.textContent = "Connecting to checkout. Please wait.";
  try {
    const response = await fetch("/api/create-order", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({packageId:p.id, playerId, region})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create order.");
    if (!window.Razorpay) throw new Error("Payment checkout did not load. Refresh and try again.");

    const checkout = new Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "Elite Store",
      description: `${data.packageName} Free Fire top-up`,
      order_id: data.razorpayOrderId,
      handler: async function (paymentResult) {
        status.textContent = "Payment response received. Verifying securely with the server…";
        try {
          const verifyResponse = await fetch("/api/verify-payment", {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(paymentResult)
          });
          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(verifyData.error || "Server could not verify payment.");
          status.textContent = verifyData.message || "Payment verified. Check order status shortly.";
        } catch (err) {
          status.textContent = "We received a payment response but could not verify it in this browser. Do not pay again yet; your payment will be checked through the payment webhook.";
        }
      },
      prefill: {},
      theme: {color:"#8792FF"},
      method: {upi:true, card:false, netbanking:false, wallet:false, emi:false, paylater:false},
      modal: {ondismiss: () => {status.textContent = "Checkout closed. Your order is not marked paid.";}}
    });
    checkout.on("payment.failed", function () {
      status.textContent = "Payment failed or was cancelled. Do not retry repeatedly; check your bank/payment app first.";
    });
    checkout.open();
    status.textContent = "Complete the UPI payment in the secure checkout. Delivery starts only after server-side verification.";
  } catch (err) {
    status.textContent = err.message || "Checkout error. Please try again later.";
  } finally {
    button.disabled = false;
    button.innerHTML = 'Pay securely with UPI <span>→</span>';
  }
});

document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("menuToggle").addEventListener("click",()=>document.querySelector(".site-header").classList.toggle("nav-open"));
document.querySelectorAll(".site-header nav a").forEach(a=>a.addEventListener("click",()=>document.querySelector(".site-header").classList.remove("nav-open")));
document.getElementById("supportLink").addEventListener("click", e => {
  e.preventDefault();
  showToast("Add your support details to the site's Support section before launch.");
});
function showToast(text){
  const el=document.getElementById("toast");el.textContent=text;el.classList.add("show");
  window.setTimeout(()=>el.classList.remove("show"),2600);
}


const copyUpiButton = document.getElementById("copyUpi");
if (copyUpiButton) {
  copyUpiButton.addEventListener("click", async () => {
    const upiId = document.getElementById("upiId").textContent.trim();
    const message = document.getElementById("upiMessage");
    try {
      await navigator.clipboard.writeText(upiId);
      message.textContent = "UPI ID copied. Verify the recipient in your UPI app before paying.";
    } catch {
      message.textContent = `Copy this UPI ID manually: ${upiId}`;
    }
  });
}
