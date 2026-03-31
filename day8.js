const form = document.getElementById("registerForm");
const fullName = document.getElementById("fullName");
const mobileNumber = document.getElementById("mobileNumber");
const otpInput = document.getElementById("otpInput");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const terms = document.getElementById("terms");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const createAccountBtn = document.getElementById("createAccountBtn");
const formMessage = document.getElementById("formMessage");
const termsLink = document.getElementById("termsLink");
const signInLink = document.getElementById("signInLink");
const callBtn = document.getElementById("callBtn");
const chatBtn = document.getElementById("chatBtn");

let generatedOtp = "";
let otpVerified = false;
let otpCooldown = null;
let secondsLeft = 0;

function setMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "message " + type;
}

function validateMobile(number) {
    return /^[6-9]\d{9}$/.test(number);
}

function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function startOtpCooldown() {
    clearInterval(otpCooldown);
    secondsLeft = 30;
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Resend in 30s";

    otpCooldown = setInterval(() => {
        secondsLeft -= 1;
        sendOtpBtn.textContent = secondsLeft > 0 ? "Resend in " + secondsLeft + "s" : "Send OTP";

        if (secondsLeft <= 0) {
            clearInterval(otpCooldown);
            sendOtpBtn.disabled = false;
        }
    }, 1000);
}

sendOtpBtn.addEventListener("click", () => {
    const number = mobileNumber.value.trim();

    if (!validateMobile(number)) {
        setMessage("Enter a valid 10-digit mobile number starting with 6-9.", "error");
        mobileNumber.focus();
        return;
    }

    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    otpVerified = false;
    otpInput.value = "";
    startOtpCooldown();
    setMessage("Demo OTP sent successfully. Use OTP: " + generatedOtp, "success");
});

otpInput.addEventListener("input", () => {
    const value = otpInput.value.trim();

    if (value.length === 6 && generatedOtp) {
        if (value === generatedOtp) {
            otpVerified = true;
            setMessage("OTP verified successfully.", "success");
        } else {
            otpVerified = false;
            setMessage("OTP does not match. Please try again.", "warning");
        }
    } else if (value.length > 0) {
        otpVerified = false;
    }
});

document.querySelectorAll(".toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.target);
        const isPassword = target.type === "password";
        target.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Hide" : "Show";
    });
});

mobileNumber.addEventListener("input", () => {
    mobileNumber.value = mobileNumber.value.replace(/\D/g, "").slice(0, 10);
});

termsLink.addEventListener("click", (event) => {
    event.preventDefault();
    alert("Terms & Conditions:\n\n1. Use a valid mobile number and email.\n2. Keep your password secure.\n3. OTP is for demo purposes in this page.");
});

signInLink.addEventListener("click", (event) => {
    event.preventDefault();
    setMessage("Sign in page is not connected yet. This demo keeps you on the registration screen.", "warning");
});

callBtn.addEventListener("click", () => {
    window.location.href = "tel:+918073000000";
});

chatBtn.addEventListener("click", () => {
    alert("Support chat is coming soon. You can add a WhatsApp or live chat link here later.");
});

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameValue = fullName.value.trim();
    const mobileValue = mobileNumber.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value;
    const confirmValue = confirmPassword.value;

    if (nameValue.length < 3) {
        setMessage("Enter your full name with at least 3 characters.", "error");
        fullName.focus();
        return;
    }

    if (!validateMobile(mobileValue)) {
        setMessage("Enter a valid 10-digit mobile number.", "error");
        mobileNumber.focus();
        return;
    }

    if (!generatedOtp) {
        setMessage("Send OTP before creating the account.", "error");
        return;
    }

    if (!otpVerified) {
        setMessage("Verify the correct OTP to continue.", "error");
        otpInput.focus();
        return;
    }

    if (!validateEmail(emailValue)) {
        setMessage("Enter a valid email address.", "error");
        email.focus();
        return;
    }

    if (passwordValue.length < 8) {
        setMessage("Password must contain at least 8 characters.", "error");
        password.focus();
        return;
    }

    if (passwordValue !== confirmValue) {
        setMessage("Password and confirm password must match.", "error");
        confirmPassword.focus();
        return;
    }

    if (!terms.checked) {
        setMessage("Please accept the Terms & Conditions.", "error");
        terms.focus();
        return;
    }

    createAccountBtn.disabled = true;
    createAccountBtn.textContent = "Creating...";
    setMessage("Your account is being created...", "success");

    setTimeout(() => {
        createAccountBtn.disabled = false;
        createAccountBtn.textContent = "Create Account";
        setMessage("Account created successfully for " + nameValue + ".", "success");
        form.reset();
        generatedOtp = "";
        otpVerified = false;
        clearInterval(otpCooldown);
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Send OTP";
        document.querySelectorAll(".toggle-btn").forEach((button) => {
            button.textContent = "Show";
        });
        password.type = "password";
        confirmPassword.type = "password";
    }, 1200);
});