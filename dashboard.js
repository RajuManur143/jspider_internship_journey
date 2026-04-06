const welcomeHeading = document.getElementById("welcomeHeading");
const welcomeSubtext = document.getElementById("welcomeSubtext");
const profileBadge = document.getElementById("profileBadge");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileMobile = document.getElementById("profileMobile");
const profilePanel = document.getElementById("profilePanel");
const logoutBtn = document.getElementById("logoutBtn");
const profileSettingsBtn = document.getElementById("profileSettingsBtn");
const applicationsBtn = document.getElementById("applicationsBtn");
const certificateBtn = document.getElementById("certificateBtn");
const callBtn = document.getElementById("callBtn");
const chatBtn = document.getElementById("chatBtn");

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

if (!currentUser) {
    window.location.href = "signin.html";
}

function getDisplayName(user) {
    if (!user) return "Student";
    if (user.name) return user.name.toUpperCase();
    if (user.email) return user.email.split("@")[0].toUpperCase();
    return "Student";
}

function getInitial(user) {
    return getDisplayName(user).charAt(0) || "S";
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function setActiveNav(sectionId) {
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.target === sectionId);
    });
}

function setProfileContent() {
    welcomeHeading.textContent = `Hello, ${getDisplayName(currentUser)}!`;
    welcomeSubtext.textContent = "Here's your learning progress for this week.";
    profileBadge.textContent = getInitial(currentUser);
    profileName.textContent = `Name: ${currentUser.name || "Student"}`;
    profileEmail.textContent = `Email: ${currentUser.email || "Not available"}`;
    profileMobile.textContent = `Mobile: ${currentUser.mobile || "Not available"}`;
}

setProfileContent();

document.querySelectorAll("[data-target]").forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        const sectionId = link.dataset.target;
        setActiveNav(sectionId);
        scrollToSection(sectionId);
    });
});

document.querySelectorAll(".course-view-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const courseName = button.dataset.course || "Selected course";
        alert(`${courseName}\n\nCourse details can be connected here next.`);
        setActiveNav("myCourses");
        scrollToSection("myCourses");
    });
});

applicationsBtn.addEventListener("click", () => {
    setActiveNav("myApplications");
    scrollToSection("myApplications");
    alert("You have no applications yet. Start a new application from the Courses section.");
});

certificateBtn.addEventListener("click", () => {
    setActiveNav("certificates");
    scrollToSection("certificates");
    alert("Certificates will unlock after course completion.");
});

profileBadge.addEventListener("click", () => {
    setActiveNav("certificates");
    scrollToSection("certificates");
    profilePanel.style.outline = "2px solid rgba(45, 102, 246, 0.28)";
    setTimeout(() => {
        profilePanel.style.outline = "none";
    }, 1600);
});

profileSettingsBtn.addEventListener("click", () => {
    setActiveNav("certificates");
    scrollToSection("certificates");
    alert("Profile settings panel opened below. You can extend it with edit fields next.");
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "signin.html";
});

callBtn.addEventListener("click", () => {
    window.location.href = "tel:+918073000000";
});

chatBtn.addEventListener("click", () => {
    alert("Support chat is coming soon!\n\nYou can add:\n- WhatsApp chat\n- Live chat widget\n- Support ticket system");
});
