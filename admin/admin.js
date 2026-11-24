
const ADMIN_USER_IDS = [
  "c214798a-fe1c-4b41-884c-87a9a025929f",
  "9ac5d5d5-2159-4080-8537-0c71c971d9c2",
  "b10f5c9f-4d25-4990-b0b2-047bf976dceb"
];

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
  
  if (!user || !ADMIN_USER_IDS.includes(user.id)) {
    await supabaseClient.auth.signOut();

    loginBox.hidden = false;
    dashboard.hidden = true;

    message.textContent =
      "You are not authorized to access this dashboard.";

    return;
  }

  const { data: packages, error } = await supabaseClient
    .from("packages")
    .select("id, type, stars, status, en, ur, price, nights, makkah, madinah");

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
// TEXTAREA HELPERS
// ======================================

function toLines(value) {
  return value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
}

function itineraryToArray(value) {
  return value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const separator = line.indexOf("|");

      if (separator === -1) return null;

      return [
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim()
      ];
    })
    .filter(item => item && item[0] && item[1]);
}

function itineraryToText(itinerary) {
  if (!Array.isArray(itinerary)) return "";

  return itinerary
    .map(item => {
      if (!Array.isArray(item)) return "";

      const day = item[0] || "";
      const description = item[1] || "";

      if (!day && !description) return "";

      return `${day} | ${description}`;
    })
    .filter(Boolean)
    .join("\n");
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
// ADD NEW PACKAGE BUTTON
// ======================================

document.getElementById("addPackageBtn")
  .addEventListener("click", () => {

    currentEditingPackageId = null;

    document.getElementById("packageForm").reset();

    document.getElementById("packageFormTitle").textContent =
      "Add New Package";

    document.getElementById("packageType").value = "umrah";
    document.getElementById("packageStars").value = "5";
    document.getElementById("packageMakkahNights").value = 7;
    document.getElementById("packageMadinahNights").value = 7;

    updateTotalNights();

    document.getElementById("packageFormMessage").textContent = "";

    document.getElementById("packageFormBox").hidden = false;

    document.getElementById("packageFormBox").scrollIntoView({
      behavior: "smooth"
    });
  });


// ======================================
// AUTOMATIC TOTAL NIGHTS
// ======================================

function updateTotalNights() {

  const makkahNights =
    Number(document.getElementById("packageMakkahNights").value) || 0;

  const madinahNights =
    Number(document.getElementById("packageMadinahNights").value) || 0;

  document.getElementById("packageNights").value =
    makkahNights + madinahNights;
}

document.getElementById("packageMakkahNights")
  .addEventListener("input", updateTotalNights);

document.getElementById("packageMadinahNights")
  .addEventListener("input", updateTotalNights);


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

    const english = selectedPackage.en || {};
    const urdu = selectedPackage.ur || {};

    currentEditingPackageId = selectedPackage.id;

    document.getElementById("packageFormTitle").textContent =
      "Edit Package: " + (english.name || selectedPackage.id);

    document.getElementById("packageType").value =
      selectedPackage.type || "umrah";

    document.getElementById("packageNameEn").value =
      english.name || "";

    document.getElementById("packageNameUr").value =
      urdu.name || "";

    document.getElementById("packagePrice").value =
      selectedPackage.price ?? "";

    document.getElementById("packageStars").value =
      selectedPackage.stars ?? 5;

    document.getElementById("packageMakkahNights").value =
      selectedPackage.makkah ?? 0;

    document.getElementById("packageMadinahNights").value =
      selectedPackage.madinah ?? 0;

    updateTotalNights();

    // English hotel names
    document.getElementById("makkahHotelEn").value =
      english.makkahHotel || "";

    document.getElementById("madinahHotelEn").value =
      english.madinahHotel || "";

    document.getElementById("packageTagEn").value =
      english.tag || "";

    document.getElementById("packageFlightEn").value =
      english.flight || "";

    document.getElementById("packageRoomEn").value =
      english.room || "";

    document.getElementById("packageIncludesEn").value =
      Array.isArray(english.includes)
        ? english.includes.join("\n")
        : "";

    document.getElementById("packageExcludesEn").value =
      Array.isArray(english.excludes)
        ? english.excludes.join("\n")
        : "";

    document.getElementById("packageItineraryEn").value =
      itineraryToText(english.itinerary);

    // Urdu hotel names
    document.getElementById("makkahHotelUr").value =
      urdu.makkahHotel || "";

    document.getElementById("madinahHotelUr").value =
      urdu.madinahHotel || "";

    document.getElementById("packageTagUr").value =
      urdu.tag || "";

    document.getElementById("packageFlightUr").value =
      urdu.flight || "";

    document.getElementById("packageRoomUr").value =
      urdu.room || "";

    document.getElementById("packageIncludesUr").value =
      Array.isArray(urdu.includes)
        ? urdu.includes.join("\n")
        : "";

    document.getElementById("packageExcludesUr").value =
      Array.isArray(urdu.excludes)
        ? urdu.excludes.join("\n")
        : "";

    document.getElementById("packageItineraryUr").value =
      itineraryToText(urdu.itinerary);

    document.getElementById("packageStatus").value =
      selectedPackage.status || "draft";

    document.getElementById("packageFormMessage").textContent = "";

    document.getElementById("packageFormBox").hidden = false;

    document.getElementById("packageFormBox").scrollIntoView({
      behavior: "smooth"
    });
  });


// ======================================
// CANCEL ADD / EDIT
// ======================================

document.getElementById("cancelPackageBtn")
  .addEventListener("click", () => {

    document.getElementById("packageFormBox").hidden = true;

    document.getElementById("packageForm").reset();

    document.getElementById("packageFormMessage").textContent = "";

    currentEditingPackageId = null;
  });


// ======================================
// SAVE NEW PACKAGE / UPDATE EXISTING
// ======================================

document.getElementById("packageForm").addEventListener("submit", async (event) => {

  event.preventDefault();

  const saveButton = event.target.querySelector('button[type="submit"]');
  const formMessage = document.getElementById("packageFormMessage");

  const isEditing = Boolean(currentEditingPackageId);

  const selectedPackage = isEditing
    ? allPackages.find(pkg => pkg.id === currentEditingPackageId)
    : null;

  if (isEditing && !selectedPackage) {
    formMessage.textContent = "Package not found.";
    return;
  }

  const nameEn = document.getElementById("packageNameEn").value.trim();
  const nameUr = document.getElementById("packageNameUr").value.trim();

  const price = Number(document.getElementById("packagePrice").value);
  const stars = Number(document.getElementById("packageStars").value);

  const makkahNights = Number(
    document.getElementById("packageMakkahNights").value
  );

  const madinahNights = Number(
    document.getElementById("packageMadinahNights").value
  );

  const totalNights = makkahNights + madinahNights;

  const type = document.getElementById("packageType").value;
  const status = document.getElementById("packageStatus").value;

  if (
    !nameEn ||
    !nameUr ||
    !Number.isFinite(price) ||
    price <= 0 ||
    ![3, 4, 5].includes(stars) ||
    !Number.isInteger(makkahNights) ||
    !Number.isInteger(madinahNights) ||
    makkahNights < 0 ||
    madinahNights < 0 ||
    totalNights < 1
  ) {
    formMessage.textContent = "Please enter valid package information.";
    return;
  }

  const updatedEnglish = {
    ...(selectedPackage?.en || {}),
    name: nameEn,
    tag: document.getElementById("packageTagEn").value.trim(),
    makkahHotel: document.getElementById("makkahHotelEn").value.trim(),
    madinahHotel: document.getElementById("madinahHotelEn").value.trim(),
    flight: document.getElementById("packageFlightEn").value.trim(),
    room: document.getElementById("packageRoomEn").value.trim(),
    includes: toLines(
      document.getElementById("packageIncludesEn").value
    ),
    excludes: toLines(
      document.getElementById("packageExcludesEn").value
    ),
    itinerary: itineraryToArray(
      document.getElementById("packageItineraryEn").value
    )
  };

  const updatedUrdu = {
    ...(selectedPackage?.ur || {}),
    name: nameUr,
    makkahHotel: document.getElementById("makkahHotelUr").value.trim(),
    madinahHotel: document.getElementById("madinahHotelUr").value.trim(),
    tag: document.getElementById("packageTagUr").value.trim(),
    flight: document.getElementById("packageFlightUr").value.trim(),
    room: document.getElementById("packageRoomUr").value.trim(),
    includes: toLines(
      document.getElementById("packageIncludesUr").value
    ),
    excludes: toLines(
      document.getElementById("packageExcludesUr").value
    ),
    itinerary: itineraryToArray(
      document.getElementById("packageItineraryUr").value
    )
  };

  const updatedData = {
    type,
    stars,
    nights: totalNights,
    makkah: makkahNights,
    madinah: madinahNights,
    price,
    en: updatedEnglish,
    ur: updatedUrdu,
    status,
    updated_at: new Date().toISOString()
  };

  // Generate a unique package ID for new packages
  const packageId = isEditing
    ? currentEditingPackageId
    : nameEn.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + Date.now();

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";
  formMessage.textContent = "Saving package...";

  try {

    let savedPackage;
    let error;

    if (isEditing) {

      const result = await supabaseClient
        .from("packages")
        .update(updatedData)
        .eq("id", packageId)
        .select()
        .single();

      savedPackage = result.data;
      error = result.error;

    } else {

      const result = await supabaseClient
        .from("packages")
        .insert({
          id: packageId,
          ...updatedData
        })
        .select()
        .single();

      savedPackage = result.data;
      error = result.error;
    }

    if (error) {
      formMessage.textContent = "Save failed: " + error.message;
      return;
    }

    if (!savedPackage) {
      formMessage.textContent = "No package data returned from Supabase.";
      return;
    }

    if (isEditing) {

      allPackages = allPackages.map(pkg =>
        pkg.id === packageId ? savedPackage : pkg
      );

    } else {

      allPackages.push(savedPackage);
    }

    renderPackages(allPackages);

    document.getElementById("totalPackages").textContent =
      allPackages.length;

    document.getElementById("umrahPackages").textContent =
      allPackages.filter(pkg => pkg.type === "umrah").length;

    document.getElementById("hajjPackages").textContent =
      allPackages.filter(pkg => pkg.type === "hajj").length;

    document.getElementById("packageFormBox").hidden = true;
    document.getElementById("packageForm").reset();

    currentEditingPackageId = null;

    formMessage.textContent = "";

    alert(
      isEditing
        ? "Package updated successfully!"
        : "New package added successfully!"
    );

  } catch (err) {

    formMessage.textContent = "Unexpected error: " + err.message;

  } finally {

    saveButton.disabled = false;
    saveButton.textContent = "Save Package";
  }

});


// ======================================
// START ADMIN SESSION CHECK
// ======================================

checkExistingSession();
