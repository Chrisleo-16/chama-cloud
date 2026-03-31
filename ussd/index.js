require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const AfricasTalking = require("africastalking");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ─── Africa's Talking Setup ─────────────────────────────────────────────
const AT = AfricasTalking({
  username: process.env.AT_USERNAME,
  apiKey: process.env.AT_API_KEY,
});
const sms = AT.SMS;

// ─── ChamaCloud API Base ────────────────────────────────────────────────────
const API_BASE = process.env.API_BASE || "https://chama-cloud-api.onrender.com/api";

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function apiGet(path, token) {
  const res = await axios.get(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}

async function apiPost(path, body, token) {
  const res = await axios.post(`${API_BASE}${path}`, body, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

// In-memory session store (use Redis in production)
const sessions = {};

function getSession(sessionId) {
  if (!sessions[sessionId]) sessions[sessionId] = {};
  return sessions[sessionId];
}

function clearSession(sessionId) {
  delete sessions[sessionId];
}

// ─── USSD Handler ─────────────────────────────────────────────────────────────

app.post("/ussd", async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;

  // Standardize phone number for the API (convert +254... or 254... to 0...)
  const phone = phoneNumber.replace("+254", "0").replace(/^254/, "0");

  // text is cumulative e.g. "1*2*500" — split into steps
  const input = text ? text.split("*") : [];
  const session = getSession(sessionId);

  // Africa's Talking sends cumulative input (e.g., "1*1234*1").
  // If we have a token and the path was "MenuID*PIN*SubMenu", we shift the input 
  // so the logic below handles the "SubMenu" correctly as if it were the top level.
  let activeInput = [...input];
  if (session.token && input.length >= 3 && ["1", "2", "3", "4", "5"].includes(input[0])) {
    activeInput = input.slice(2);
  }

  const vStep = activeInput.length;
  const vText = activeInput.join("*");
  const vLast = activeInput[vStep - 1];
  let response = "";

  try {
    // ── STEP 0: Main Menu ──────────────────────────────────────────────────
    if (vText === "") {
      response = `CON Welcome to ChamaCloud 🌱
1. My Groups
2. Contribute to Group
3. My Savings Balance
4. Join a Group
5. My Profile
0. Exit`;
    }

    // ── MAIN MENU SELECTIONS ───────────────────────────────────────────────

    // ── 1. My Groups ───────────────────────────────────────────────────────
    else if (vText === "1") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "1";
      } else {
        const groups = await apiGet("/groups/list/", session.token);
        if (!groups || groups.length === 0) {
          response = `END You have no groups yet.\nDial again to join one.`;
        } else {
          session.groups = groups;
          let menu = `CON Your Groups:\n`;
          groups.slice(0, 5).forEach((g, i) => {
            const pct = Math.round(parseFloat(g.progress_percentage || "0"));
            menu += `${i + 1}. ${g.name} (${pct}%)\n`;
          });
          menu += `0. Back`;
          response = menu;
        }
      }
    }

    // ── PIN Entry (for any protected action) ───────────────────────────────
    else if (
      session.pendingAction &&
      vStep === 2 &&
      activeInput[0] === session.pendingAction
    ) {
      const pin = vLast;
      // Authenticate using phone number + PIN as password
      try {
        const data = await apiPost("/token/", {
          phone_number: phone,
          password: pin,
        });
        session.token = data.access;
        session.refreshToken = data.refresh;

        // Decode JWT payload to get basic user info (no profile endpoint available)
        try {
          const payload = JSON.parse(
            Buffer.from(data.access.split(".")[1], "base64").toString("utf8"),
          );
          session.firstName = payload.first_name || "";
          session.lastName = payload.last_name || "";
          session.role = payload.role || "";
        } catch {
          // JWT decode failed — profile fields just won't show
        }

        session.pendingAction = null;

        // Redirect to original intended action
        // Re-route by resetting text to the original action
        response = `CON PIN accepted ✓
1. My Groups
2. Contribute to Group
3. My Savings Balance
4. Join a Group
5. My Profile
0. Exit`;
      } catch (err) {
        console.error("Login failed for:", phone, "Error:", err?.response?.data || err.message);
        clearSession(sessionId);
        response = `END ✗ Incorrect PIN. Please try again.`;
      }
    }

    // ── 1 → Group Detail ───────────────────────────────────────────────────
    else if (activeInput[0] === "1" && vStep === 2 && vLast !== "0") {
      const idx = parseInt(vLast) - 1;
      const g = session.groups?.[idx];
      if (!g) {
        response = `END Invalid selection.`;
      } else {
        const current = parseFloat(g.current_amount || "0").toLocaleString("en-KE");
        const target = parseFloat(g.target_amount || "0").toLocaleString("en-KE");
        const pct = Math.round(parseFloat(g.progress_percentage || "0"));
        response = `END ${g.name}
Status: ${g.is_active ? "Active" : "Inactive"}
Members: ${g.members_count || 0}
Saved: KES ${current}
Target: KES ${target}
Progress: ${pct}%
${g.is_fully_funded === "True" ? "✓ Fully Funded!" : ""}`;
      }
    }

    // ── 2. Contribute ──────────────────────────────────────────────────────
    else if (vText === "2") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "2";
      } else {
        const groups = await apiGet("/groups/list/", session.token);
        if (!groups || groups.length === 0) {
          response = `END You have no groups to contribute to.`;
        } else {
          session.contributeGroups = groups;
          let menu = `CON Select group to contribute to:\n`;
          groups.slice(0, 5).forEach((g, i) => {
            menu += `${i + 1}. ${g.name}\n`;
          });
          menu += `0. Back`;
          response = menu;
        }
      }
    }

    // ── 2 → Select group → Enter amount ───────────────────────────────────
    else if (activeInput[0] === "2" && vStep === 2 && vLast !== "0") {
      const idx = parseInt(vLast) - 1;
      const g = session.contributeGroups?.[idx];
      if (!g) {
        response = `END Invalid selection.`;
      } else {
        session.contributeGroupId = g.id;
        session.contributeGroupName = g.name;
        response = `CON Enter amount to contribute to ${g.name} (KES):`;
      }
    }

    // ── 2 → Group → Amount → Confirm ──────────────────────────────────────
    else if (activeInput[0] === "2" && vStep === 3) {
      const amount = parseFloat(vLast);
      if (isNaN(amount) || amount <= 0) {
        response = `END Invalid amount. Please try again.`;
      } else {
        session.contributeAmount = amount;
        response = `CON Confirm contribution:
Group: ${session.contributeGroupName}
Amount: KES ${amount.toLocaleString("en-KE")}

1. Confirm
2. Cancel`;
      }
    }

    // ── 2 → Group → Amount → Confirm → Submit ─────────────────────────────
    else if (activeInput[0] === "2" && vStep === 4) {
      if (vLast === "1") {
        try {
          await apiPost(
            "/groups/contributions/",
            {
              group: session.contributeGroupId,
              amount: session.contributeAmount,
            },
            session.token,
          );
          response = `END ✓ Contribution of KES ${session.contributeAmount.toLocaleString("en-KE")} to ${session.contributeGroupName} was successful!`;
        } catch (err) {
          response = `END ✗ Contribution failed. Please try again later.`;
        }
      } else {
        response = `END Contribution cancelled.`;
      }
    }

    // ── 3. My Savings Balance ──────────────────────────────────────────────
    else if (vText === "3") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "3";
      } else {
        const groups = await apiGet("/groups/list/", session.token);
        if (!groups || groups.length === 0) {
          response = `END You have no savings yet.`;
        } else {
          let total = 0;
          let detail = "";
          groups.forEach((g) => {
            const amt = parseFloat(g.current_amount || "0");
            total += amt;
            detail += `${g.name}: KES ${amt.toLocaleString("en-KE")}\n`;
          });
          response = `END Your Savings Summary:
${detail}
Total: KES ${total.toLocaleString("en-KE")}`;
        }
      }
    }

    // ── 4. Join a Group ────────────────────────────────────────────────────
    else if (vText === "4") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "4";
      } else {
        // List all available groups so user can pick by number
        const groups = await apiGet("/groups/list/", session.token);
        if (!groups || groups.length === 0) {
          response = `END No groups available to join.`;
        } else {
          session.allGroups = groups;
          let menu = `CON Select a group to join:\n`;
          groups.slice(0, 5).forEach((g, i) => {
            menu += `${i + 1}. ${g.name} (${g.members_count || 0} members)\n`;
          });
          menu += `0. Back`;
          response = menu;
        }
      }
    }

    else if (activeInput[0] === "4" && vStep === 2 && vLast !== "0") {
      const idx = parseInt(vLast) - 1;
      const g = session.allGroups?.[idx];
      if (!g) {
        response = `END Invalid selection.`;
      } else {
        session.joinGroupId = g.id;
        session.joinGroupName = g.name;
        response = `CON Join "${g.name}"?
Members: ${g.members_count || 0}
Target: KES ${parseFloat(g.target_amount || "0").toLocaleString("en-KE")}

1. Yes, join
2. Cancel`;
      }
    }

    else if (activeInput[0] === "4" && vStep === 3) {
      if (vLast === "1") {
        try {
          // PATCH the group to add current user as member
          await axios.patch(
            `${API_BASE}/groups/list/${session.joinGroupId}/`,
            {},
            { headers: { Authorization: `Bearer ${session.token}` } },
          );
          response = `END ✓ You have successfully joined "${session.joinGroupName}"!`;
        } catch {
          response = `END ✗ Could not join group. You may already be a member.`;
        }
      } else {
        response = `END Join cancelled.`;
      }
    }

    // ── 5. My Profile ──────────────────────────────────────────────────────
    else if (vText === "5") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "5";
      } else {
        // Profile data was stored at login time from the token response
        response = `END Your Profile:
Name: ${session.firstName || "N/A"} ${session.lastName || ""}
Phone: ${phone}
Role: ${session.role || "N/A"}`;
      }
    }

    // ── 0. Exit ────────────────────────────────────────────────────────────
    else if (vText === "0") {
      clearSession(sessionId);
      response = `END Thank you for using ChamaCloud. Goodbye! 🌱`;
    }


    // ── Fallback ───────────────────────────────────────────────────────────
    else {
      response = `END Invalid selection. Please dial again.`;
    }
  } catch (err) {
    console.error("USSD error:", err?.response?.data || err.message);
    response = `END An error occurred. Please try again later.`;
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`USSD server running on port ${PORT}`));