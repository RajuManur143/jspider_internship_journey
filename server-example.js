require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname, { index: false }));

let registeredUsers = [];
const otpStore = new Map();

const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    OTP_EXPIRY_MINUTES = "10"
} = process.env;

const smsClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

function validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}

function formatIndianPhone(mobile) {
    return mobile.startsWith("+") ? mobile : `+91${mobile}`;
}

async function sendOtpSms(mobile, otp) {
    if (!smsClient || !TWILIO_PHONE_NUMBER) {
        console.warn(`SMS gateway not configured. Development OTP for ${mobile}: ${otp}`);
        return {
            success: true,
            delivery: "development",
            otp
        };
    }

    await smsClient.messages.create({
        body: `Your verification OTP is ${otp}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        from: TWILIO_PHONE_NUMBER,
        to: formatIndianPhone(mobile)
    });

    return {
        success: true,
        delivery: "sms"
    };
}

app.post("/api/otp/send", async(req, res) => {
    try {
        const { mobile } = req.body;

        if (!validateMobile(mobile)) {
            return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
        }

        const existingUser = registeredUsers.find((user) => user.mobile === mobile);
        if (existingUser) {
            return res.status(400).json({ success: false, message: "This mobile number is already registered." });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + Number(OTP_EXPIRY_MINUTES) * 60 * 1000;

        const deliveryResult = await sendOtpSms(mobile, otp);
        otpStore.set(mobile, { otp, expiresAt, verified: false });

        return res.json({
            success: true,
            message: deliveryResult.delivery === "sms"
                ? `OTP sent successfully to ${mobile}.`
                : `SMS gateway is not configured. Use the development OTP shown in the app.`,
            delivery: deliveryResult.delivery,
            otp: deliveryResult.delivery === "development" ? otp : undefined
        });
    } catch (error) {
        console.error("OTP send error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Unable to send OTP."
        });
    }
});

app.post("/api/otp/verify", (req, res) => {
    const { mobile, otp } = req.body;
    const otpEntry = otpStore.get(mobile);

    if (!otpEntry) {
        return res.status(400).json({ success: false, message: "Send OTP before verifying." });
    }

    if (Date.now() > otpEntry.expiresAt) {
        otpStore.delete(mobile);
        return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
    }

    if (otpEntry.otp !== otp) {
        return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again." });
    }

    otpStore.set(mobile, { ...otpEntry, verified: true });
    return res.json({ success: true, message: "OTP verified successfully." });
});

app.post("/api/users/register", async(req, res) => {
    try {
        const { name, mobile, email, password } = req.body;

        if (!name || !mobile || !email || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        if (!validateMobile(mobile)) {
            return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
        }

        const otpEntry = otpStore.get(mobile);
        if (!otpEntry || !otpEntry.verified) {
            return res.status(400).json({ success: false, message: "Verify OTP before creating the account." });
        }

        const existingUser = registeredUsers.find((user) => user.email === email || user.mobile === mobile);
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already registered with this email or mobile." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            name,
            mobile,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        registeredUsers.push(newUser);
        otpStore.delete(mobile);

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
});

app.get("/api/users", (req, res) => {
    res.json({
        total: registeredUsers.length,
        users: registeredUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            createdAt: user.createdAt
        }))
    });
});

app.post("/api/users/login", async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = registeredUsers.find((entry) => entry.email === email);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        return res.json({
            success: true,
            message: "Login successful.",
            data: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "day8.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("API ready for registration form");
});
