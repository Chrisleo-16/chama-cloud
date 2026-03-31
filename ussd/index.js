require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const AfricasTalking = require("africastalking");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ─── Africa's Talking Setup ──────────────────────────────────────────────────
const AT = AfricasTalking({
  username: process.env.AT_USERNAME,
  apiKey: process.env.AT_API_KEY,
});
const sms = AT.SMS;

// ─── ChamaCloud API Base ─────────────────────────────────────────────────────
const API_BASE =
  process.env.API_BASE || "https://chama-cloud-api.onrender.com/api";

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

async function apiPatch(path, body, token) {
  const res = await axios.patch(`${API_BASE}${path}`, body, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data;
}

// ─── JWT Decode Helper ───────────────────────────────────────────────────────
function decodeJwt(token) {
  try {
    return JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString("utf8")
    );
  } catch {
    return {};
  }
}

// ─── Phone Normalizer ────────────────────────────────────────────────────────
// API expects 07XXXXXXXX format
function normalizePhone(phoneNumber) {
  return phoneNumber.replace("+254", "0").replace(/^254/, "0");
}

// For STK push the API expects 254XXXXXXXXX (international without +)
function toInternationalPhone(phoneNumber) {
  const local = normalizePhone(phoneNumber);
  return "254" + local.slice(1);
}

// ─── In-Memory Session Store (use Redis in production) ───────────────────────
const sessions = {};

function getSession(sessionId) {
  if (!sessions[sessionId]) sessions[sessionId] = {};
  return sessions[sessionId];
}

function clearSession(sessionId) {
  delete sessions[sessionId];
}

// ─── SMS Notification Helper ─────────────────────────────────────────────────
async function sendSms(to, message) {
  try {
    await sms.send({ to: [to], message });
  } catch (err) {
    console.error("SMS send failed:", err.message);
  }
}

// ─── Token Refresh Helper ─────────────────────────────────────────────────────
async function refreshAccessToken(session) {
  if (!session.refreshToken) throw new Error("No refresh token");
  const data = await apiPost("/token/refresh/", {
    refresh: session.refreshToken,
  });
  session.token = data.access;
  return session.token;
}

// ─── Authenticated API call with auto-refresh ────────────────────────────────
async function authGet(path, session) {
  try {
    return await apiGet(path, session.token);
  } catch (err) {
    if (err?.response?.status === 401) {
      await refreshAccessToken(session);
      return await apiGet(path, session.token);
    }
    throw err;
  }
}

async function authPost(path, body, session) {
  try {
    return await apiPost(path, body, session.token);
  } catch (err) {
    if (err?.response?.status === 401) {
      await refreshAccessToken(session);
      return await apiPost(path, body, session.token);
    }
    throw err;
  }
}

async function authPatch(path, body, session) {
  try {
    return await apiPatch(path, body, session.token);
  } catch (err) {
    if (err?.response?.status === 401) {
      await refreshAccessToken(session);
      return await apiPatch(path, body, session.token);
    }
    throw err;
  }
}

// ─── MAIN MENU string ────────────────────────────────────────────────────────
const MAIN_MENU = `CON Welcome to ChamaCloud 🌱
1. My Groups
2. Contribute to Group
3. My Savings Balance
4. Join a Group
5. My Profile
6. My Vouchers
7. Wholesaler Menu
8. Register
0. Exit`;

const MAIN_MENU_AFTER_LOGIN = `CON Main Menu:
1. My Groups
2. Contribute to Group
3. My Savings Balance
4. Join a Group
5. My Profile
6. My Vouchers
7. Wholesaler Menu
0. Exit`;

// ─── USSD Handler ─────────────────────────────────────────────────────────────

app.post("/ussd", async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;

  const phone = normalizePhone(phoneNumber);
  const intlPhone = toInternationalPhone(phoneNumber);

  const input = text ? text.split("*") : [];
  const session = getSession(sessionId);

  // ── Determine active input ─────────────────────────────────────────────────
  // If authenticated and first input was a menu digit + PIN, slice past them
  let activeInput = [...input];
  if (
    session.token &&
    input.length >= 3 &&
    ["1", "2", "3", "4", "5", "6", "7"].includes(input[0]) &&
    session.pinVerified
  ) {
    activeInput = input.slice(2);
  }

  const vStep = activeInput.length;
  const vText = activeInput.join("*");
  const vLast = activeInput[vStep - 1] || "";
  let response = "";

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // STEP 0 — Main Menu
    // ══════════════════════════════════════════════════════════════════════════
    if (vText === "") {
      response = MAIN_MENU;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // REGISTER (option 8) — No auth required
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "8") {
      response = `CON Enter your first name:`;
      session.regStep = "firstName";
    }

    else if (session.regStep === "firstName" && vStep === 2) {
      session.regFirstName = vLast;
      session.regStep = "lastName";
      response = `CON Enter your last name:`;
    }

    else if (session.regStep === "lastName" && vStep === 3) {
      session.regLastName = vLast;
      session.regStep = "pin";
      response = `CON Create a 4-digit PIN:`;
    }

    else if (session.regStep === "pin" && vStep === 4) {
      if (!/^\d{4}$/.test(vLast)) {
        response = `END ✗ PIN must be 4 digits. Please dial again.`;
        clearSession(sessionId);
      } else {
        session.regPin = vLast;
        session.regStep = "confirmPin";
        response = `CON Confirm your PIN:`;
      }
    }

    else if (session.regStep === "confirmPin" && vStep === 5) {
      if (vLast !== session.regPin) {
        response = `END ✗ PINs do not match. Please dial again.`;
        clearSession(sessionId);
      } else {
        try {
          await apiPost("/auth/register/", {
            phone_number: phone,
            first_name: session.regFirstName,
            last_name: session.regLastName,
            password: session.regPin,
          });
          clearSession(sessionId);
          response = `END ✓ Registration successful!
Welcome, ${session.regFirstName}!
Dial again to log in.`;
        } catch (err) {
          const errData = err?.response?.data;
          const msg =
            errData?.phone_number?.[0] ||
            errData?.detail ||
            "Registration failed.";
          clearSession(sessionId);
          response = `END ✗ ${msg}`;
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PIN ENTRY — for any protected action
    // ══════════════════════════════════════════════════════════════════════════
    else if (
      session.pendingAction &&
      vStep === 2 &&
      activeInput[0] === session.pendingAction
    ) {
      const pin = vLast;
      try {
        const data = await apiPost("/token/", {
          phone_number: phone,
          password: pin,
        });
        session.token = data.access;
        session.refreshToken = data.refresh;
        session.pinVerified = true;

        const payload = decodeJwt(data.access);
        session.firstName = payload.first_name || "";
        session.lastName = payload.last_name || "";
        session.role = payload.role || "";
        session.userId = payload.user_id || null;
        session.pendingAction = null;

        response = MAIN_MENU_AFTER_LOGIN;
      } catch (err) {
        console.error(
          "Login failed for:",
          phone,
          err?.response?.data || err.message
        );
        clearSession(sessionId);
        response = `END ✗ Incorrect PIN or unregistered number.\nDial *XXX# to register first.`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 1. MY GROUPS
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "1") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "1";
      } else {
        const groups = await authGet("/groups/list/", session);
        if (!groups || groups.length === 0) {
          response = `END You are not in any groups yet.\nDial again to join one.`;
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

    // 1 → Group detail
    else if (activeInput[0] === "1" && vStep === 2 && vLast !== "0") {
      const idx = parseInt(vLast) - 1;
      const g = session.groups?.[idx];
      if (!g) {
        response = `END Invalid selection.`;
      } else {
        // Fetch full group detail by ID
        let detail = g;
        try {
          detail = await authGet(`/groups/list/${g.id}/`, session);
        } catch { /* fall back to list data */ }

        const current = parseFloat(detail.current_amount || "0").toLocaleString("en-KE");
        const target = parseFloat(detail.target_amount || "0").toLocaleString("en-KE");
        const pct = Math.round(parseFloat(detail.progress_percentage || "0"));

        response = `END ${detail.name}
Status: ${detail.is_active ? "Active" : "Inactive"}
Members: ${detail.members_count || 0}
Saved: KES ${current}
Target: KES ${target}
Progress: ${pct}%
${detail.is_fully_funded ? "✓ Fully Funded!" : ""}`;
      }
    }

    // 1 → Back
    else if (activeInput[0] === "1" && vStep === 2 && vLast === "0") {
      response = MAIN_MENU_AFTER_LOGIN;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. CONTRIBUTE — with M-Pesa STK Push
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "2") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "2";
      } else {
        const groups = await authGet("/groups/list/", session);
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

    // 2 → Select group
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

    // 2 → Group → Amount
    else if (activeInput[0] === "2" && vStep === 3) {
      const amount = parseFloat(vLast);
      if (isNaN(amount) || amount <= 0) {
        response = `END Invalid amount. Please try again.`;
      } else {
        session.contributeAmount = amount;
        response = `CON Confirm contribution:
Group: ${session.contributeGroupName}
Amount: KES ${amount.toLocaleString("en-KE")}
Payment: M-Pesa STK Push to ${phone}

1. Confirm & Pay via M-Pesa
2. Confirm (manual record only)
3. Cancel`;
      }
    }

    // 2 → Confirm
    else if (activeInput[0] === "2" && vStep === 4) {
      if (vLast === "1") {
        // Trigger M-Pesa STK Push via ChamaCloud payments API
        try {
          await authPost(
            "/payments/stk-push/",
            {
              phone_number: intlPhone,
              amount: session.contributeAmount,
              group_id: session.contributeGroupId,
            },
            session
          );
          response = `END ✓ M-Pesa payment request sent!
Check your phone for the M-Pesa prompt.
Amount: KES ${session.contributeAmount.toLocaleString("en-KE")}
Group: ${session.contributeGroupName}

You will receive an SMS confirmation.`;
        } catch (err) {
          const errMsg =
            err?.response?.data?.detail ||
            err?.response?.data?.error ||
            "STK push failed.";
          // Fallback: record contribution directly
          try {
            await authPost(
              "/groups/contributions/",
              {
                group: session.contributeGroupId,
                amount: session.contributeAmount,
              },
              session
            );
            response = `END ✓ Contribution of KES ${session.contributeAmount.toLocaleString("en-KE")} recorded.
(Note: M-Pesa prompt unavailable — ${errMsg})`;
          } catch {
            response = `END ✗ Contribution failed. Please try again.`;
          }
        }
      } else if (vLast === "2") {
        // Manual contribution record (no M-Pesa)
        try {
          await authPost(
            "/groups/contributions/",
            {
              group: session.contributeGroupId,
              amount: session.contributeAmount,
            },
            session
          );
          response = `END ✓ Contribution of KES ${session.contributeAmount.toLocaleString("en-KE")} to ${session.contributeGroupName} recorded!`;
        } catch {
          response = `END ✗ Contribution failed. Please try again later.`;
        }
      } else {
        response = `END Contribution cancelled.`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. MY SAVINGS BALANCE
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "3") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "3";
      } else {
        const groups = await authGet("/groups/list/", session);
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

          // Also fetch contributions history count
          let contribCount = 0;
          try {
            const contribs = await authGet("/groups/contributions/", session);
            contribCount = Array.isArray(contribs) ? contribs.length : (contribs?.count || 0);
          } catch { /* optional */ }

          response = `END Your Savings Summary:
${detail}
Total: KES ${total.toLocaleString("en-KE")}
Contributions made: ${contribCount}`;
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. JOIN A GROUP
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "4") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "4";
      } else {
        const groups = await authGet("/groups/list/", session);
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

    // 4 → Select group
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

    // 4 → Confirm join
    else if (activeInput[0] === "4" && vStep === 3) {
      if (vLast === "1") {
        try {
          await authPatch(
            `/groups/list/${session.joinGroupId}/`,
            {},
            session
          );
          response = `END ✓ You have successfully joined "${session.joinGroupName}"!
You can now contribute to this group.`;
        } catch (err) {
          const errMsg =
            err?.response?.data?.detail || "Could not join group.";
          response = `END ✗ ${errMsg}\nYou may already be a member.`;
        }
      } else {
        response = `END Join cancelled.`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 5. MY PROFILE
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "5") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "5";
      } else {
        // Fetch live contribution stats for profile enrichment
        let contribTotal = "N/A";
        try {
          const contribs = await authGet("/groups/contributions/", session);
          const list = Array.isArray(contribs) ? contribs : (contribs?.results || []);
          const sum = list.reduce(
            (acc, c) => acc + parseFloat(c.amount || "0"),
            0
          );
          contribTotal = `KES ${sum.toLocaleString("en-KE")}`;
        } catch { /* optional */ }

        response = `END Your Profile:
Name: ${session.firstName || "N/A"} ${session.lastName || ""}
Phone: ${phone}
Role: ${session.role || "Member"}
Total Contributed: ${contribTotal}`;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 6. MY VOUCHERS
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "6") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "6";
      } else {
        try {
          const vouchers = await authGet("/groups/vouchers/", session);
          const list = Array.isArray(vouchers)
            ? vouchers
            : vouchers?.results || [];
          if (list.length === 0) {
            response = `END You have no vouchers yet.
Vouchers are earned when your group reaches its target!`;
          } else {
            session.vouchers = list;
            let menu = `CON Your Vouchers (${list.length}):\n`;
            list.slice(0, 5).forEach((v, i) => {
              const status = v.is_used ? "Used" : "Active";
              const val = parseFloat(v.value || v.amount || "0").toLocaleString("en-KE");
              menu += `${i + 1}. KES ${val} - ${status}\n`;
            });
            menu += `0. Back`;
            response = menu;
          }
        } catch (err) {
          response = `END ✗ Could not load vouchers. Try again later.`;
        }
      }
    }

    // 6 → Voucher detail
    else if (activeInput[0] === "6" && vStep === 2 && vLast !== "0") {
      const idx = parseInt(vLast) - 1;
      const v = session.vouchers?.[idx];
      if (!v) {
        response = `END Invalid selection.`;
      } else {
        const val = parseFloat(v.value || v.amount || "0").toLocaleString("en-KE");
        const expiry = v.expires_at
          ? new Date(v.expires_at).toLocaleDateString("en-KE")
          : "N/A";
        response = `END Voucher Details:
Code: ${v.code || v.id}
Value: KES ${val}
Status: ${v.is_used ? "Used" : "Active"}
Group: ${v.group_name || "N/A"}
Expires: ${expiry}`;
      }
    }

    // 6 → Back
    else if (activeInput[0] === "6" && vStep === 2 && vLast === "0") {
      response = MAIN_MENU_AFTER_LOGIN;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 7. WHOLESALER MENU
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "7") {
      if (!session.token) {
        response = `CON Enter your PIN to continue:`;
        session.pendingAction = "7";
      } else {
        response = `CON Wholesaler Menu:
1. View My Groups (Wholesaler)
2. View Vouchers to Redeem
3. Scan/Claim a Voucher
0. Back`;
      }
    }

    // 7 → 1: Wholesaler groups
    else if (activeInput[0] === "7" && vStep === 2 && vLast === "1") {
      try {
        const groups = await authGet("/groups/wholesaler/groups/", session);
        const list = Array.isArray(groups) ? groups : groups?.results || [];
        if (list.length === 0) {
          response = `END No wholesaler groups found.`;
        } else {
          session.wholesalerGroups = list;
          let menu = `CON Wholesaler Groups:\n`;
          list.slice(0, 5).forEach((g, i) => {
            const funded = g.is_fully_funded ? "✓" : "○";
            menu += `${i + 1}. ${funded} ${g.name}\n`;
          });
          menu += `0. Back`;
          response = menu;
        }
      } catch {
        response = `END ✗ Access denied or no wholesaler groups.`;
      }
    }

    // 7 → 1 → Group detail
    else if (
      activeInput[0] === "7" &&
      activeInput[1] === "1" &&
      vStep === 3 &&
      vLast !== "0"
    ) {
      const idx = parseInt(vLast) - 1;
      const g = session.wholesalerGroups?.[idx];
      if (!g) {
        response = `END Invalid selection.`;
      } else {
        const current = parseFloat(g.current_amount || "0").toLocaleString("en-KE");
        const target = parseFloat(g.target_amount || "0").toLocaleString("en-KE");
        const pct = Math.round(parseFloat(g.progress_percentage || "0"));
        response = `END ${g.name}
Members: ${g.members_count || 0}
Saved: KES ${current} / KES ${target}
Progress: ${pct}%
Funded: ${g.is_fully_funded ? "Yes ✓" : "No"}`;
      }
    }

    // 7 → 2: Wholesaler vouchers
    else if (activeInput[0] === "7" && vStep === 2 && vLast === "2") {
      try {
        const vouchers = await authGet("/groups/wholesaler/vouchers/", session);
        const list = Array.isArray(vouchers) ? vouchers : vouchers?.results || [];
        if (list.length === 0) {
          response = `END No vouchers pending redemption.`;
        } else {
          session.wholesalerVouchers = list;
          let menu = `CON Vouchers to Redeem:\n`;
          list.slice(0, 5).forEach((v, i) => {
            const val = parseFloat(v.value || v.amount || "0").toLocaleString("en-KE");
            const status = v.is_used ? "Claimed" : "Pending";
            menu += `${i + 1}. KES ${val} [${status}]\n`;
          });
          menu += `0. Back`;
          response = menu;
        }
      } catch {
        response = `END ✗ Could not load wholesaler vouchers.`;
      }
    }

    // 7 → 3: Scan/Claim a voucher
    else if (activeInput[0] === "7" && vStep === 2 && vLast === "3") {
      response = `CON Enter the voucher code to claim:`;
      session.wholesalerScanStep = true;
    }

    else if (session.wholesalerScanStep && activeInput[0] === "7" && vStep === 3) {
      const voucherId = vLast.trim();
      session.wholesalerScanVoucherId = voucherId;
      session.wholesalerScanStep = false;
      response = `CON Claim voucher: ${voucherId}?

1. Confirm claim
2. Cancel`;
    }

    else if (
      session.wholesalerScanVoucherId &&
      activeInput[0] === "7" &&
      vStep === 4
    ) {
      if (vLast === "1") {
        try {
          await authPatch(
            `/groups/wholesaler/scan/${session.wholesalerScanVoucherId}/`,
            {},
            session
          );
          response = `END ✓ Voucher ${session.wholesalerScanVoucherId} successfully claimed!`;
        } catch (err) {
          const errMsg =
            err?.response?.data?.detail || "Voucher claim failed.";
          response = `END ✗ ${errMsg}`;
        }
      } else {
        response = `END Voucher claim cancelled.`;
      }
      session.wholesalerScanVoucherId = null;
    }

    // 7 → Back
    else if (activeInput[0] === "7" && vStep === 2 && vLast === "0") {
      response = MAIN_MENU_AFTER_LOGIN;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 0. EXIT
    // ══════════════════════════════════════════════════════════════════════════
    else if (vText === "0") {
      clearSession(sessionId);
      response = `END Thank you for using ChamaCloud. Goodbye! 🌱`;
    }

    // ── Fallback ──────────────────────────────────────────────────────────────
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

// ─── M-Pesa Payment Callback (called by ChamaCloud / Safaricom) ──────────────
app.post("/payments/callback", async (req, res) => {
  // ChamaCloud's backend handles the actual callback at /api/payments/callback/
  // This local endpoint is for any additional processing (SMS notifications, logs)
  try {
    const { Body } = req.body;
    const stkCallback = Body?.stkCallback;
    if (stkCallback?.ResultCode === 0) {
      // Payment successful
      const amount = stkCallback.CallbackMetadata?.Item?.find(
        (i) => i.Name === "Amount"
      )?.Value;
      const phoneRef = stkCallback.CallbackMetadata?.Item?.find(
        (i) => i.Name === "PhoneNumber"
      )?.Value;
      console.log(`✓ STK Push success: KES ${amount} from ${phoneRef}`);
    } else {
      console.log(
        `✗ STK Push failed: ${stkCallback?.ResultDesc}`
      );
    }
  } catch (err) {
    console.error("Callback processing error:", err.message);
  }
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ChamaCloud USSD", timestamp: new Date() });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ ChamaCloud USSD server running on port ${PORT}`)
);