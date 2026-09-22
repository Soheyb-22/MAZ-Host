/* MAZ Host UI v4.0
   Keeps the MAZ interface visible while WebKitty's real exploit runs underneath.
   No exploit/kernel/payload implementation is replaced.
*/
(function () {
  "use strict";

  var home = null;
  var homeReturn = null;
  var running = false;
  var succeeded = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function fwValue() {
    try {
      if (typeof user !== "undefined" && user && user.ps4Fw) return String(user.ps4Fw);
    } catch (e) {}

    try {
      var saved = localStorage.getItem("ps4Fw");
      if (saved && saved !== "null" && saved !== "undefined") return String(saved);
    } catch (e2) {}

    try {
      var m = navigator.userAgent.match(/PlayStation 4[\/ ]([0-9.]+)/i);
      if (m && m[1]) return m[1];
    } catch (e3) {}

    return "13.04";
  }

  function goldHenValue() {
    var v = "GHv2.4b18.12";
    try {
      v = localStorage.getItem("GHVer") || v;
    } catch (e) {}
    return String(v).replace(/^GHv?/i, "");
  }

  function exploitName() {
    var fw = parseFloat(fwValue());
    var chain = null;

    try {
      if (typeof user !== "undefined" && user) chain = Number(user.exploitChain);
    } catch (e) {}

    if (chain === 7) return "Relapse";
    if (chain === 5 || chain === 6) return "SlopKit";
    if (chain === 0 || chain === 1) return "PSFree + Lapse";
    if (chain === 3 || chain === 4) return "CSSFontFace";
    if (chain === 2) return "BadHoist";
    if (!isNaN(fw) && fw >= 13.02 && fw <= 13.52) return "Relapse";
    return "WebKitty";
  }

  function isSupported() {
    var fw = parseFloat(fwValue());
    if (isNaN(fw)) return true;

    try {
      if (typeof webKitMin !== "undefined" && typeof webKitMax !== "undefined") {
        return fw >= Number(webKitMin) && fw <= Number(webKitMax);
      }
    } catch (e) {}

    return fw >= 6.70 && fw <= 13.52;
  }

  function escapeHtml(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(label, detail, mode) {
    var launch = byId("maz-launch");
    var box = byId("maz-run-state");
    var line = byId("maz-run-line");
    var detailEl = byId("maz-run-detail");
    var retry = byId("maz-retry");
    var infoStatus = byId("maz-status-value");

    if (box) box.className = "maz-run-state maz-visible";
    if (line) line.innerHTML = (mode === "running" ? '<span class="maz-spinner"></span>' : "") + escapeHtml(label || "");
    if (detailEl) detailEl.textContent = detail || "";

    if (launch) {
      launch.className = "maz-launch";
      if (mode === "running") launch.className += " maz-running";
      if (mode === "success") launch.className += " maz-success";
      if (mode === "failed") launch.className += " maz-failed";
    }

    if (retry) {
      retry.className = "maz-retry" + (mode === "failed" ? " maz-visible" : "");
    }

    if (infoStatus) {
      infoStatus.textContent =
        mode === "running" ? "Running" :
        mode === "success" ? "Ready" :
        mode === "failed" ? "Failed" : "Ready";

      infoStatus.className = "maz-info-value";
      if (mode === "running") infoStatus.className += " maz-status-running";
      if (mode === "success") infoStatus.className += " maz-status-success";
      if (mode === "failed") infoStatus.className += " maz-status-failed";
    }
  }

  function resetStatus() {
    running = false;
    succeeded = false;

    var launch = byId("maz-launch");
    var box = byId("maz-run-state");
    var retry = byId("maz-retry");
    var infoStatus = byId("maz-status-value");

    if (launch) launch.className = "maz-launch";
    if (box) box.className = "maz-run-state";
    if (retry) retry.className = "maz-retry";
    if (infoStatus) {
      infoStatus.textContent = "Ready";
      infoStatus.className = "maz-info-value";
    }

    try {
      if (typeof user !== "undefined" && user) user.blockJailbreak = false;
    } catch (e) {}
  }

  function mapLogToState(message) {
    if (!running || succeeded || !message) return;

    var text = String(message);
    var lower = text.toLowerCase();

    if (
      lower.indexOf("jailbreak failed") !== -1 ||
      lower.indexOf("kernel exploit failed") !== -1 ||
      lower.indexOf("failed to load") !== -1 ||
      lower.indexOf("please restart console and try again") !== -1 ||
      lower.indexOf("please refresh page and try again") !== -1
    ) {
      running = false;
      setStatus("Jailbreak Failed", "Please try again.", "failed");
      return;
    }

    if (lower.indexOf("kernel exploit") !== -1) {
      setStatus("Running kernel exploit...", text, "running");
      return;
    }

    if (
      lower.indexOf("payload") !== -1 ||
      lower.indexOf("goldhen") !== -1 ||
      lower.indexOf("hen") !== -1
    ) {
      setStatus("Loading GoldHEN...", text, "running");
      return;
    }

    if (
      lower.indexOf("initializ") !== -1 ||
      lower.indexOf("loading") !== -1 ||
      lower.indexOf("exploit") !== -1
    ) {
      setStatus("Initializing exploit...", text, "running");
    }
  }

  function hookLog() {
    if (typeof window.log !== "function") return false;
    if (window.log.__mazWrapped) return true;

    var originalLog = window.log;
    var wrapped = function () {
      try {
        mapLogToState(arguments[0]);
      } catch (e) {}
      return originalLog.apply(this, arguments);
    };
    wrapped.__mazWrapped = true;
    window.log = wrapped;
    return true;
  }

  function makePsIcon() {
    return '' +
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<path fill="currentColor" d="M23 10c4 1 9 3 12 5 5 3 8 7 8 13 0 7-4 12-10 15v-9c2-1 4-3 4-6 0-3-2-5-5-7-2-1-5-2-9-3v35l-7-2V12c2 0 4 0 7-2z"/>' +
      '<path fill="currentColor" d="M49 39c0 4-3 7-8 9-7 3-18 5-28 4l-1-6c9 1 18-1 24-3 4-2 6-3 6-4 0-1-2-1-4-1l-8-1v-6l11 1c6 1 8 3 8 7z"/>' +
      '</svg>';
  }

  function makeSuccessOverlay() {
    if (byId("maz-success")) return;

    var fw = fwValue();
    var gh = goldHenValue();

    var box = document.createElement("div");
    box.id = "maz-success";
    box.innerHTML =
      '<div class="maz-success-card">' +
        '<button class="maz-success-close" type="button" aria-label="Close">&times;</button>' +
        '<div class="maz-success-toprow">' +
          '<div class="maz-ps-side maz-ps-left">' + makePsIcon() + '</div>' +
          '<div class="maz-ps-side maz-ps-right">' + makePsIcon() + '</div>' +
          '<div class="maz-success-burst">' +
            '<span></span><span></span><span></span><span></span>' +
            '<span></span><span></span><span></span><span></span>' +
          '</div>' +
          '<div class="maz-success-photo-wrap">' +
            '<div class="maz-success-photo-ring"></div>' +
            '<img class="maz-success-photo" src="./includes/maz/mohamed.jpeg" alt="Mohamed">' +
          '</div>' +
        '</div>' +
        '<div class="maz-approved-pill">' +
          '<span class="maz-approved-icon">&#10003;</span>' +
          '<span class="maz-approved-text">APPROVED</span>' +
        '</div>' +
        '<div class="maz-success-heading">GoldHEN Loaded Successfully!</div>' +
        '<div class="maz-success-meta">Firmware ' + fw + ' | GoldHEN ' + gh + '</div>' +
        '<div class="maz-success-divider"></div>' +
        '<div class="maz-success-footer">MORE FREEDOM&nbsp;&nbsp; SAME CONSOLE</div>' +
      '</div>';

    document.body.appendChild(box);

    var closeBtn = box.querySelector(".maz-success-close");
    if (closeBtn) {
      closeBtn.onclick = function () {
        box.style.display = "none";
        box.className = "";
      };
    }
  }

  function showSuccess() {
    var box = byId("maz-success");
    if (!box) return;

    box.className = "";
    box.style.display = "flex";
    void box.offsetWidth;
    box.className = "maz-show";

    window.setTimeout(function () {
      box.style.display = "none";
      box.className = "";
    }, 4200);
  }

  function hookSuccess() {
    makeSuccessOverlay();

    if (typeof window.jailbreakSuccess !== "function") return false;
    if (window.jailbreakSuccess.__mazWrapped) return true;

    var originalSuccess = window.jailbreakSuccess;
    var wrapped = function () {
      succeeded = true;
      running = false;
      setStatus("GoldHEN Loaded Successfully!", "System ready.", "success");
      showSuccess();
      return originalSuccess.apply(this, arguments);
    };
    wrapped.__mazWrapped = true;
    window.jailbreakSuccess = wrapped;
    return true;
  }

  function runRealJailbreak() {
    var realRun = byId("exploitRun");
    if (!realRun || running) return;

    succeeded = false;
    running = true;
    setStatus("Initializing exploit...", "Starting WebKitty exploit chain.", "running");

    /* Important:
       We DO NOT hide #maz-home and DO NOT scroll to WebKitty.
       We simply click WebKitty's real exploit button underneath.
    */
    try {
      realRun.click();
    } catch (e) {
      running = false;
      setStatus("Jailbreak Failed", "Could not start the real WebKitty action.", "failed");
    }
  }

  function showWebKittySection(section) {
    var target = byId("exploit-main-screen") || byId("exploitContainer");
    if (home) home.style.display = "none";
    if (homeReturn) homeReturn.style.display = "block";

    if (section === "tools") {
      var tools = byId("tools-tab");
      if (tools) tools.click();
    } else if (section === "linux") {
      var linux = byId("linux-tab");
      if (linux) linux.click();
    }

    if (target && target.scrollIntoView) target.scrollIntoView({ block: "start" });
  }

  function bindRealButton(buttonId, requiredId, action) {
    var btn = byId(buttonId);
    var real = requiredId ? byId(requiredId) : null;

    if (!btn) return;

    if (requiredId && !real) {
      btn.style.display = "none";
      return;
    }

    btn.onclick = action;
  }

  function makeHome() {
    if (byId("maz-home")) return;

    var fw = fwValue();
    var gh = goldHenValue();
    var exploit = exploitName();
    var support = isSupported() ? "SUPPORTED" : "CHECK FW";

    home = document.createElement("div");
    home.id = "maz-home";
    home.innerHTML =
      '<div class="maz-wrap">' +
        '<div class="maz-top">' +
          '<div class="maz-ps4">PS4</div>' +
          '<h1 class="maz-title"><span class="maz-title-gold">GOLDHEN</span> <span class="maz-title-white">' + escapeHtml(gh) + '</span></h1>' +
          '<div class="maz-fw-sub">Firmware ' + escapeHtml(fw) + '</div>' +
          '<div class="maz-badge"><span class="maz-badge-fw">' + escapeHtml(fw) + '</span>' +
            '<span>' + support + '<br>GOLDHEN ' + escapeHtml(gh) + '<br>MAZ HOST</span></div>' +
          '<div class="maz-tagline">EXPLOIT &nbsp;·&nbsp; HEN &nbsp;·&nbsp; HOMEBREW &nbsp;·&nbsp; YOUR PS4 &nbsp;·&nbsp; YOUR RULES</div>' +
        '</div>' +

        '<button id="maz-launch" class="maz-launch" type="button">' +
          '<span class="maz-launch-main">MAZ</span>' +
          '<span class="maz-launch-sub">Exploit &rarr; Load GoldHEN</span>' +
        '</button>' +

        '<div id="maz-run-state" class="maz-run-state">' +
          '<div id="maz-run-line" class="maz-run-line"></div>' +
          '<div id="maz-run-detail" class="maz-run-detail"></div>' +
          '<button id="maz-retry" class="maz-retry" type="button">TRY AGAIN</button>' +
        '</div>' +

        '<div class="maz-cards">' +
          '<button id="maz-payloads" class="maz-card" type="button">' +
            '<span class="maz-card-icon">&#9650;</span><span class="maz-card-title">PAYLOADS</span><span class="maz-card-sub">Open Payloads</span>' +
          '</button>' +
          '<button id="maz-tools" class="maz-card" type="button">' +
            '<span class="maz-card-icon">&#9881;</span><span class="maz-card-title">TOOLS</span><span class="maz-card-sub">Utilities &amp; Apps</span>' +
          '</button>' +
          '<button id="maz-linux" class="maz-card" type="button">' +
            '<span class="maz-card-icon">L</span><span class="maz-card-title">LINUX</span><span class="maz-card-sub">Linux Payloads</span>' +
          '</button>' +
          '<button id="maz-settings" class="maz-card" type="button">' +
            '<span class="maz-card-icon">&#9881;</span><span class="maz-card-title">SETTINGS</span><span class="maz-card-sub">Host Options</span>' +
          '</button>' +
        '</div>' +

        '<div class="maz-info">' +
          '<h3>System Information</h3>' +
          '<div class="maz-info-row"><span class="maz-info-key">Firmware</span>: <span class="maz-info-value">' + escapeHtml(fw) + '</span></div>' +
          '<div class="maz-info-row"><span class="maz-info-key">GoldHEN</span>: <span class="maz-info-value">' + escapeHtml(gh) + '</span></div>' +
          '<div class="maz-info-row"><span class="maz-info-key">Exploit</span>: <span class="maz-info-value">' + escapeHtml(exploit) + '</span></div>' +
          '<div class="maz-info-row"><span class="maz-info-key">Status</span>: <span id="maz-status-value" class="maz-info-value">Ready</span></div>' +
          '<div class="maz-motto">More Freedom<br>Same Console</div>' +
        '</div>' +
      '</div>' +

      '<div class="maz-footer">' +
        '<span class="maz-footer-left">for moh</span>' +
        'PS4 &nbsp;·&nbsp; ' + escapeHtml(fw) + ' &nbsp;·&nbsp; GOLDHEN ' + escapeHtml(gh) +
      '</div>';

    document.body.appendChild(home);

    homeReturn = document.createElement("button");
    homeReturn.id = "maz-home-return";
    homeReturn.className = "maz-home-return";
    homeReturn.type = "button";
    homeReturn.innerHTML = "MAZ HOME";
    homeReturn.onclick = function () {
      home.style.display = "block";
      homeReturn.style.display = "none";
      if (window.scrollTo) window.scrollTo(0, 0);
    };
    document.body.appendChild(homeReturn);

    bindRealButton("maz-launch", "exploitRun", runRealJailbreak);

    var retry = byId("maz-retry");
    if (retry) {
      retry.onclick = function () {
        resetStatus();
        window.setTimeout(runRealJailbreak, 80);
      };
    }

    bindRealButton("maz-payloads", "payloadsGrid", function () {
      showWebKittySection("payloads");
      window.setTimeout(function () {
        var grid = byId("payloadsGrid");
        if (grid && grid.scrollIntoView) grid.scrollIntoView({ block: "start" });
      }, 60);
    });

    bindRealButton("maz-tools", "tools-tab", function () {
      showWebKittySection("tools");
    });

    bindRealButton("maz-linux", "linux-tab", function () {
      showWebKittySection("linux");
    });

    var settingsBtn = byId("maz-settings");
    if (settingsBtn) {
      var realSettings = byId("settings-btn");
      if (!realSettings && typeof window.settingsPopup !== "function") {
        settingsBtn.style.display = "none";
      } else {
        settingsBtn.onclick = function () {
          if (typeof window.settingsPopup === "function") {
            window.settingsPopup();
          } else if (realSettings) {
            realSettings.click();
          }
        };
      }
    }
  }

  function installHooks() {
    var ok1 = hookLog();
    var ok2 = hookSuccess();
    return ok1 && ok2;
  }

  function init() {
    makeHome();

    if (!installHooks()) {
      var tries = 0;
      var timer = window.setInterval(function () {
        tries++;
        if (installHooks() || tries > 40) window.clearInterval(timer);
      }, 200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
