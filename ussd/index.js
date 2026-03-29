const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const API_BASE = "https://chama-cloud-api.onrender.com/api";

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

  // text is cumulative e.g. "1*2*500" — split into steps
  const input = text ? text.split("*") : [];
  const step = input.length;
  const last = input[input.length - 1];

  const session = getSession(sessionId);
  let response = "";

  try {
    // ── STEP 0: Main Menu ──────────────────────────────────────────────────
    if (text === "") {
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
    else if (text === "1") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "1";
      } else {
        const groups = await apiGet("/groups/", session.token);
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

    // ── 1 → Group Detail ───────────────────────────────────────────────────
    else if (input[0] === "1" && step === 2 && last !== "0") {
      const idx = parseInt(last) - 1;
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
    else if (text === "2") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "2";
      } else {
        const groups = await apiGet("/groups/", session.token);
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
    else if (input[0] === "2" && step === 2 && last !== "0") {
      const idx = parseInt(last) - 1;
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
    else if (input[0] === "2" && step === 3) {
      const amount = parseFloat(last);
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
    else if (input[0] === "2" && step === 4) {
      if (last === "1") {
        try {
          await apiPost(
            "/contributions/",
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
    else if (text === "3") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "3";
      } else {
        const groups = await apiGet("/groups/", session.token);
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
    else if (text === "4") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "4";
      } else {
        response = `CON Enter the Group ID to join:`;
      }
    }

    else if (input[0] === "4" && step === 2) {
      const groupId = parseInt(last);
      if (isNaN(groupId)) {
        response = `END Invalid Group ID.`;
      } else {
        session.joinGroupId = groupId;
        response = `CON Confirm joining group ID ${groupId}?
1. Yes, join
2. Cancel`;
      }
    }

    else if (input[0] === "4" && step === 3) {
      if (last === "1") {
        try {
          await apiPost(
            `/groups/${session.joinGroupId}/join/`,
            {},
            session.token,
          );
          response = `END ✓ You have successfully joined the group!`;
        } catch {
          response = `END ✗ Could not join group. It may not exist or you are already a member.`;
        }
      } else {
        response = `END Join cancelled.`;
      }
    }

    // ── 5. My Profile ──────────────────────────────────────────────────────
    else if (text === "5") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "5";
      } else {
        const profile = await apiGet("/auth/profile/", session.token);
        response = `END Your Profile:
Name: ${profile.first_name} ${profile.last_name}
Phone: ${profile.phone_number || phoneNumber}
Email: ${profile.email || "N/A"}`;
      }
    }

    // ── 0. Exit ────────────────────────────────────────────────────────────
    else if (text === "0") {
      clearSession(sessionId);
      response = `END Thank you for using ChamaCloud. Goodbye! 🌱`;
    }

    // ── PIN Entry (for any protected action) ───────────────────────────────
    else if (
      session.pendingAction &&
      step === 2 &&
      input[0] === session.pendingAction
    ) {
      const pin = last;
      // Authenticate using phone number + PIN as password
      try {
        const data = await apiPost("/auth/token/", {
          phone_number: phoneNumber,
          password: pin,
        });
        session.token = data.access;
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
      } catch {
        clearSession(sessionId);
        response = `END ✗ Incorrect PIN. Please try again.`;
      }
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