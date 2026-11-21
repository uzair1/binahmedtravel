
const ADMIN_USER_ID = "c214798a-fe1c-4b41-884c-87a9a025929f";

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

const supabaseClient = window.supabaseClient;

// Package management state
let allPackages = [];
let currentEditingPackageId = null;


// ======================================
// DASHBOARD
// ======================================

async function loadDashboard(user) {
  if (!user || user.id !== ADMIN_USER_ID) {
    await supabaseClient.auth.signOut();

    loginBox.hidden = false;
    dashboard.hidden = true;

    message.textContent =
      "You are not authorized to access this dashboard.";

    return;
  }

  const { data: packages, error } = await supabaseClient
    .from("packages")
    .select("id, type, status, en, ur, price, nights, makkah, madinah");

  if (error) {
    message.textContent =
      "Could not load packages: " + error.message;
    return;
  }

  allPackages = packages || [];

  renderPackages(allPackages);

  document.getElementById("totalPackages").textContent =
    allPackages.length;

  document.getElementById("umrahPackages").textContent =
    allPackages.filter(pkg => pkg.type === "umrah").length;

  document.getElementById("hajjPackages").textContent =
    allPackages.filter(pkg => pkg.type === "hajj").length;

  loginBox.hidden = true;
  dashboard.hidden = false;
}


// ======================================
// LOGIN
// ======================================

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  message.textContent = "Checking login...";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    message.textContent = error.message;
    return;
  }

  await loadDashboard(data.user);
});


// ======================================
// LOGOUT
// ======================================

document.getElementById("logoutBtn").addEventListener("click", async (event) => {
  event.preventDefault();

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert("Logout failed: " + error.message);
    return;
  }

  dashboard.hidden = true;
  loginBox.hidden = false;

  loginForm.reset();

  message.textContent = "You have logged out.";
});


// ======================================
// EXISTING SESSION
// ======================================

async function checkExistingSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    message.textContent = error.message;
    return;
  }

  if (data.session) {
    await loadDashboard(data.session.user);
  }
}


// ======================================
// PASSWORD RECOVERY
// ======================================

document.getElementById("forgotPassword").addEventListener("click", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    message.textContent =
      "Please enter your administrator email first.";
    return;
  }

  message.textContent = "Sending password recovery email...";

  const { error } =
    await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/admin/reset-password.html"
    });

  if (error) {
    message.textContent = error.message;
    return;
  }

  message.textContent =
  "If this account exists, a password recovery email has been sent. Please check your inbox.";
});


// ======================================
// HTML SECURITY HELPER
// ======================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}


// ======================================
// DISPLAY PACKAGES
// ======================================

function renderPackages(packages) {
  const tbody = document.getElementById("packagesTableBody");

  if (!packages.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="padding:20px;text-align:center;">
          No packages found.
        </td>
      </tr>`;

    return;
  }

  tbody.innerHTML = packages.map(pkg => {
    const name = pkg.en?.name || pkg.id;

    return `
      <tr>
        <td style="padding:13px;border-bottom:1px solid #eee;">
          ${escapeHTML(name)}
        </td>

        <td style="padding:13px;border-bottom:1px solid #eee;">
          ${escapeHTML(pkg.type.toUpperCase())}
        </td>

        <td style="padding:13px;border-bottom:1px solid #eee;">
          ${Number(pkg.price).toLocaleString("en-PK")}
        </td>

        <td style="padding:13px;border-bottom:1px solid #eee;">
          ${escapeHTML(pkg.status)}
        </td>

        <td style="padding:13px;border-bottom:1px solid #eee;">
          <button class="edit-package-btn"
            data-id="${escapeHTML(pkg.id)}">
            Edit
          </button>
        </td>
      </tr>`;
  }).join("");
}


// ======================================
// SEARCH AND FILTER
// ======================================

function filterPackages() {
  const search = document.getElementById("packageSearch")
    .value.toLowerCase();

  const type = document.getElementById("packageFilter").value;

  const filtered = allPackages.filter(pkg => {
    const name = (pkg.en?.name || pkg.id).toLowerCase();

    return (
      name.includes(search) &&
      (type === "all" || pkg.type === type)
    );
  });

  renderPackages(filtered);
}

document.getElementById("packageSearch")
  .addEventListener("input", filterPackages);

document.getElementById("packageFilter")
  .addEventListener("change", filterPackages);


// ======================================
// EDIT PACKAGE BUTTON
// ======================================

document.getElementById("packagesTableBody")
  .addEventListener("click", (event) => {

    const button = event.target.closest(".edit-package-btn");

    if (!button) return;

    const packageId = button.dataset.id;

    const selectedPackage = allPackages.find(
      pkg => pkg.id === packageId
    );

    if (!selectedPackage) return;

    currentEditingPackageId = selectedPackage.id;

    document.getElementById("packageFormTitle").textContent =
      "Edit Package: " + selectedPackage.en.name;

    document.getElementById("packageNameEn").value =
      selectedPackage.en?.name || "";

    document.getElementById("packageNameUr").value =
      selectedPackage.ur?.name || "";

    document.getElementById("packagePrice").value =
      selectedPackage.price ?? "";

    document.getElementById("packageNights").value =
      selectedPackage.nights ?? "";

    document.getElementById("makkahHotelEn").value =
      selectedPackage.en?.makkahHotel || "";

    document.getElementById("madinahHotelEn").value =
      selectedPackage.en?.madinahHotel || "";

    document.getElementById("packageStatus").value =
      selectedPackage.status;

    document.getElementById("packageFormMessage").textContent = "";

    document.getElementById("packageFormBox").hidden = false;

    document.getElementById("packageFormBox").scrollIntoView({
      behavior: "smooth"
    });
  });


// ======================================
// CANCEL EDIT
// ======================================

document.getElementById("cancelPackageBtn")
  .addEventListener("click", () => {

    document.getElementById("packageFormBox").hidden = true;

    document.getElementById("packageForm").reset();

    document.getElementById("packageFormMessage").textContent = "";

    currentEditingPackageId = null;
  });


// ======================================
// START ADMIN SESSION CHECK
// ======================================

// ======================================
// SAVE PACKAGE CHANGES
// ======================================

document.getElementById("packageForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const saveButton = event.target.querySelector('button[type="submit"]');
  const formMessage = document.getElementById("packageFormMessage");

  if (!currentEditingPackageId) {
    formMessage.textContent = "No package selected.";
    return;
  }

  const selectedPackage = allPackages.find(
    pkg => pkg.id === currentEditingPackageId
  );

  if (!selectedPackage) {
    formMessage.textContent = "Package not found.";
    return;
  }

  const updatedEnglish = {
    ...selectedPackage.en,
    name: document.getElementById("packageNameEn").value.trim(),
    makkahHotel: document.getElementById("makkahHotelEn").value.trim(),
    madinahHotel: document.getElementById("madinahHotelEn").value.trim()
  };

  const updatedUrdu = {
    ...selectedPackage.ur,
    name: document.getElementById("packageNameUr").value.trim()
  };

  const updatedData = {
    en: updatedEnglish,
    ur: updatedUrdu,
    price: Number(document.getElementById("packagePrice").value),
    nights: Number(document.getElementById("packageNights").value),
    status: document.getElementById("packageStatus").value,
    updated_at: new Date().toISOString()
  };

  if (
    !updatedEnglish.name ||
    !updatedUrdu.name ||
    !Number.isFinite(updatedData.price) ||
    updatedData.price <= 0 ||
    !Number.isInteger(updatedData.nights) ||
    updatedData.nights < 1
  ) {
    formMessage.textContent = "Please enter valid package information.";
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";
  formMessage.textContent = "Saving package...";

console.log("PACKAGE ID:", currentEditingPackageId);
console.log("DATA BEING SENT:", updatedData);

const { data, error } = await supabaseClient
  .from("packages")
  .update(updatedData)
  .eq("id", currentEditingPackageId)
  .select("id");

console.log("UPDATE RESPONSE:", data);
console.log("UPDATE ERROR:", error);

if (!error && (!data || data.length === 0)) {
  saveButton.disabled = false;
  saveButton.textContent = "Save Changes";

  formMessage.textContent =
    "No package was updated. Check administrator permissions and package ID.";

  return;
}

  saveButton.disabled = false;
  saveButton.textContent = "Save Changes";

  if (error) {
    formMessage.textContent = "Save failed: " + error.message;
    return;
  }

  allPackages = allPackages.map(pkg =>
    pkg.id === currentEditingPackageId
      ? { ...pkg, ...updatedData }
      : pkg
  );

  filterPackages();

  document.getElementById("packageFormBox").hidden = true;
  document.getElementById("packageForm").reset();

  currentEditingPackageId = null;

  formMessage.textContent = "Package updated successfully!";
});

checkExistingSession();
