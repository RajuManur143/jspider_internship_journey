const signinForm = document.getElementById("signinForm");
const signinEmail = document.getElementById("signinEmail");
const signinPassword = document.getElementById("signinPassword");
const rememberMe = document.getElementById("rememberMe");
const signInSubmitBtn = document.getElementById("signInSubmitBtn");
const signinMessage = document.getElementById("signinMessage");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const callBtn = document.getElementById("callBtn");
const chatBtn = document.getElementById("chatBtn");

const API_BASE_URL = "http://localhost:5000/api";

function setSigninMessage(text, type) {
    signinMessage.textContent = text;
    signinMessage.className = "message " + type;
}

function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function signInWithApi(payload) {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || "Unable to sign in.");
    }

    return result;
}

function signInLocally(email, password) {
    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    const user = users.find((entry) => entry.email === email && entry.password === password);

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    return {
        success: true,
        message: "Signed in successfully.",
        data: user
    };
}

function handleLoginSuccess(result, emailValue) {
    const payload = result.data || { email: emailValue };
    localStorage.setItem("currentUser", JSON.stringify(payload));

    if (rememberMe.checked) {
        localStorage.setItem("rememberedEmail", emailValue);
    } else {
        localStorage.removeItem("rememberedEmail");
    }

    setSigninMessage(result.message || "Signed in successfully.", "success");

    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 700);
}

document.querySelectorAll(".toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.target);
        const isPassword = target.type === "password";
        target.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Hide" : "Show";
    });
});

signinForm.addEventListener("submit", async(event) => {
    event.preventDefault();

    const emailValue = signinEmail.value.trim();
    const passwordValue = signinPassword.value;

    if (!validateEmail(emailValue)) {
        setSigninMessage("Enter a valid email address.", "error");
        signinEmail.focus();
        return;
    }

    if (passwordValue.length < 8) {
        setSigninMessage("Enter your password to continue.", "error");
        signinPassword.focus();
        return;
    }

    signInSubmitBtn.disabled = true;
    signInSubmitBtn.textContent = "Signing In...";
    setSigninMessage("Checking your credentials...", "success");

    try {
        const result = await signInWithApi({ email: emailValue, password: passwordValue });
        handleLoginSuccess(result, emailValue);
    } catch (apiError) {
        try {
            const localResult = signInLocally(emailValue, passwordValue);
            handleLoginSuccess(localResult, emailValue);
        } catch (localError) {
            setSigninMessage(localError.message || apiError.message || "Unable to sign in.", "error");
        }
    } finally {
        signInSubmitBtn.disabled = false;
        signInSubmitBtn.textContent = "Sign In";
    }
});

forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();
    setSigninMessage("Password reset can be added next. For now, use your registered password.", "warning");
});

callBtn.addEventListener("click", () => {
    window.location.href = "tel:+918073000000";
});

chatBtn.addEventListener("click", () => {
    alert("Support chat is coming soon!\n\nYou can add:\n- WhatsApp chat\n- Live chat widget\n- Support ticket system");
});

const rememberedEmail = localStorage.getItem("rememberedEmail");
if (rememberedEmail) {
    signinEmail.value = rememberedEmail;
    rememberMe.checked = true;
}
