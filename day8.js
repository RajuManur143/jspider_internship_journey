const form = document.getElementById("registerForm");
const fullName = document.getElementById("fullName");
const mobileNumber = document.getElementById("mobileNumber");
const otpInput = document.getElementById("otpInput");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const terms = document.getElementById("terms");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const createAccountBtn = document.getElementById("createAccountBtn");
const formMessage = document.getElementById("formMessage");
const termsLink = document.getElementById("termsLink");
const signInLink = document.getElementById("signInLink");
const callBtn = document.getElementById("callBtn");
const chatBtn = document.getElementById("chatBtn");

const API_BASE_URL = "http://localhost:5000/api";
let otpVerified = false;
let otpCooldown = null;
let secondsLeft = 0;
let otpBoxEnabled = false;

function setMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "message " + type;
}

function validateMobile(number) {
    return /^[6-9]\d{9}$/.test(number);
}

function validateOtp(value) {
    return /^\d{6}$/.test(value);
}

function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePassword(pwd) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
}

function calculatePasswordStrength(pwd) {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#\$%^&*]/.test(pwd)) strength++;
    return strength;
}

function getPasswordStrengthText(strength) {
    const strengthMap = { 0: "None", 1: "Weak", 2: "Fair", 3: "Good", 4: "Strong", 5: "Very Strong", 6: "Excellent" };
    return strengthMap[strength] || "None";
}

function saveUserLocally(userData) {
    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const userExists = users.some((user) => user.email === userData.email || user.mobile === userData.mobile);

    if (userExists) {
        return { success: false, message: "Email or mobile already registered!" };
    }

    const payload = {
        ...userData,
        id: Date.now().toString(),
        registeredAt: new Date().toLocaleString()
    };

    users.push(payload);
    localStorage.setItem("registeredUsers", JSON.stringify(users));
    return { success: true, message: "User data saved to local storage", data: payload };
}

async function sendApiRequest(endpoint, payload) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || "Request failed");
    }

    return result;
}

async function saveUserToDatabase(userData) {
    try {
        const result = await sendApiRequest("/users/register", userData);
        return { success: true, message: result.message || "Account created successfully!", data: result };
    } catch (error) {
        console.error("Database error:", error);
        return saveUserLocally(userData);
    }
}

function startOtpCooldown() {
    clearInterval(otpCooldown);
    secondsLeft = 30;
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Resend in 30s";

    otpCooldown = setInterval(() => {
        secondsLeft -= 1;
        sendOtpBtn.textContent = secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Send OTP";

        if (secondsLeft <= 0) {
            clearInterval(otpCooldown);
            sendOtpBtn.disabled = false;
        }
    }, 1000);
}

function enableOtpInput() {
    otpBoxEnabled = true;
    otpInput.disabled = false;
    verifyOtpBtn.disabled = false;
    otpInput.focus();
    otpInput.placeholder = "Enter 6 digit OTP";
    otpInput.style.borderColor = "var(--primary)";
    otpInput.style.boxShadow = "0 0 0 4px rgba(45, 102, 246, 0.12)";
}

function resetOtpState() {
    otpVerified = false;
    otpBoxEnabled = false;
    otpInput.value = "";
    otpInput.disabled = true;
    otpInput.style.borderColor = "var(--line)";
    otpInput.style.boxShadow = "none";
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "Verify OTP";
    mobileNumber.disabled = false;
}

sendOtpBtn.addEventListener("click", async() => {
    const number = mobileNumber.value.trim();

    if (!validateMobile(number)) {
        setMessage("Enter a valid 10-digit mobile number starting with 6-9.", "error");
        mobileNumber.focus();
        return;
    }

    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    if (users.some((user) => user.mobile === number)) {
        setMessage("This mobile number is already registered.", "warning");
        return;
    }

    otpVerified = false;
    otpInput.value = "";
    mobileNumber.disabled = true;
    sendOtpBtn.disabled = true;
    verifyOtpBtn.disabled = true;
    setMessage(`Sending OTP to ${number}...`, "success");

    try {
        const result = await sendApiRequest("/otp/send", { mobile: number });
        startOtpCooldown();
        enableOtpInput();
        if (result.delivery === "development" && result.otp) {
            setMessage(`Development OTP: ${result.otp}. Add Twilio credentials for real SMS delivery.`, "warning");
        } else {
            setMessage(result.message || `OTP sent to ${number}.`, "success");
        }
    } catch (error) {
        mobileNumber.disabled = false;
        sendOtpBtn.disabled = false;
        setMessage(error.message || "Unable to send OTP right now.", "error");
    }
});

verifyOtpBtn.addEventListener("click", async() => {
    const mobile = mobileNumber.value.trim();
    const otp = otpInput.value.trim();

    if (!otpBoxEnabled) {
        setMessage("Send OTP first to enable verification.", "warning");
        return;
    }

    if (!validateOtp(otp)) {
        setMessage("Enter the 6-digit OTP received on your mobile.", "error");
        otpInput.focus();
        return;
    }

    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "Verifying...";

    try {
        const result = await sendApiRequest("/otp/verify", { mobile, otp });
        otpVerified = true;
        otpInput.style.borderColor = "var(--success)";
        otpInput.style.boxShadow = "0 0 0 4px rgba(15, 157, 88, 0.12)";
        verifyOtpBtn.textContent = "Verified";
        setMessage(result.message || "OTP verified successfully.", "success");
    } catch (error) {
        otpVerified = false;
        otpInput.style.borderColor = "var(--danger)";
        otpInput.style.boxShadow = "0 0 0 4px rgba(220, 38, 38, 0.12)";
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = "Verify OTP";
        setMessage(error.message || "OTP verification failed.", "error");
    }
});

otpInput.addEventListener("input", () => {
    otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 6);

    if (otpVerified) {
        otpVerified = false;
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = "Verify OTP";
        otpInput.style.borderColor = "var(--line)";
        otpInput.style.boxShadow = "none";
        setMessage("OTP changed. Please verify again.", "warning");
    }
});

otpInput.addEventListener("focus", () => {
    if (!otpBoxEnabled) {
        otpInput.blur();
        setMessage("Send OTP first to enable this field.", "warning");
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

password.addEventListener("input", () => {
    const strength = calculatePasswordStrength(password.value);
    if (password.value) {
        console.log(`Password Strength: ${getPasswordStrengthText(strength)}`);
    }
});

mobileNumber.addEventListener("input", () => {
    mobileNumber.value = mobileNumber.value.replace(/\D/g, "").slice(0, 10);

    if (otpBoxEnabled || otpVerified) {
        clearInterval(otpCooldown);
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Send OTP";
        resetOtpState();
        setMessage("Mobile number changed. Send a fresh OTP.", "warning");
    }
});

email.addEventListener("blur", () => {
    if (email.value.trim() && !validateEmail(email.value.trim())) {
        setMessage("Enter a valid email address.", "error");
    }
});

termsLink.addEventListener("click", (event) => {
    event.preventDefault();
    alert("TERMS & CONDITIONS\n\nUse a valid mobile number and email.\nKeep your password secure.\nData is encrypted and stored securely.\nOTP is valid for 10 minutes.\nYou agree to our privacy policy.");
});

signInLink.addEventListener("click", (event) => {
    if (signInLink.getAttribute("href")) {
        return;
    }
    event.preventDefault();
    window.location.href = "signin.html";
});

callBtn.addEventListener("click", () => {
    window.location.href = "tel:+918073000000";
});

chatBtn.addEventListener("click", () => {
    alert("Support chat is coming soon!\n\nYou can add:\n- WhatsApp chat\n- Live chat widget\n- Support ticket system");
});

form.addEventListener("submit", async(event) => {
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

    if (!otpBoxEnabled) {
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

    if (!validatePassword(passwordValue)) {
        setMessage("Password must have 8+ characters with uppercase, lowercase, and numbers.", "error");
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
    createAccountBtn.textContent = "Creating Account...";
    setMessage("Creating your account...", "success");

    const userData = {
        name: nameValue,
        mobile: mobileValue,
        email: emailValue,
        password: passwordValue,
        createdAt: new Date().toISOString()
    };

    const result = await saveUserToDatabase(userData);

    if (result.success) {
        localStorage.setItem("currentUser", JSON.stringify({
            name: nameValue,
            email: emailValue,
            mobile: mobileValue
        }));
        setMessage(`${result.message} Welcome ${nameValue}!`, "success");

        setTimeout(() => {
            form.reset();
            clearInterval(otpCooldown);
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "Send OTP";
            createAccountBtn.disabled = false;
            createAccountBtn.textContent = "Create Account";
            resetOtpState();

            document.querySelectorAll(".toggle-btn").forEach((button) => {
                button.textContent = "Show";
            });

            password.type = "password";
            confirmPassword.type = "password";
            window.location.href = "dashboard.html";
        }, 1500);
    } else {
        setMessage(`Error: ${result.message}`, "error");
        createAccountBtn.disabled = false;
        createAccountBtn.textContent = "Create Account";
    }
});

resetOtpState();
