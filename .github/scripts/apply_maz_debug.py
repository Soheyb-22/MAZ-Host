from pathlib import Path


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f"anchor not found: {label}")
    return text.replace(old, new, 1)


# --- MAZ UI: observe Relapse's existing #console stage output ---
p = Path("includes/maz/maz-ui.js")
s = p.read_text(encoding="utf-8")

marker = "  function makePsIcon() {"
debug_block = r'''  var relapseDebugObserver = null;
  var relapseDebugTimer = null;
  var relapseLastStage = "";

  function getRelapseLastLine() {
    var out = byId("console");
    if (!out) return "";

    var text = String(out.textContent || "");
    var parts = text.split(/\r?\n/);
    for (var i = parts.length - 1; i >= 0; i--) {
      var line = String(parts[i] || "").replace(/^\s+|\s+$/g, "");
      if (line) return line;
    }
    return "";
  }

  function updateRelapseDebug() {
    if (!running || succeeded) return;

    var last = getRelapseLastLine();
    if (!last || last === relapseLastStage) return;
    relapseLastStage = last;

    try {
      localStorage.setItem("mazLastRelapseStage", last);
    } catch (e) {}

    var fail = /FAIL|ERROR|THREW|TIMEOUT|ABORTED|MISMATCH|MISS|LOST|POISON|REBOOT/i.test(last);
    var tag = last;
    var sep = last.indexOf("  ");
    if (sep > 0) tag = last.substring(0, sep);
    if (tag.length > 32) tag = tag.substring(0, 32);

    if (fail) {
      running = false;
      setStatus("Relapse stopped: " + tag, last, "failed");
      stopRelapseDebug();
      return;
    }

    setStatus("Relapse: " + tag, last, "running");
  }

  function stopRelapseDebug() {
    if (relapseDebugObserver) {
      try { relapseDebugObserver.disconnect(); } catch (e) {}
      relapseDebugObserver = null;
    }
    if (relapseDebugTimer) {
      window.clearInterval(relapseDebugTimer);
      relapseDebugTimer = null;
    }
  }

  function startRelapseDebug() {
    stopRelapseDebug();
    relapseLastStage = "";

    try {
      localStorage.removeItem("mazLastRelapseStage");
    } catch (e) {}

    var out = byId("console");
    if (!out) return;

    if (typeof MutationObserver !== "undefined") {
      relapseDebugObserver = new MutationObserver(function () {
        updateRelapseDebug();
      });
      relapseDebugObserver.observe(out, {
        childList: true,
        subtree: true,
        characterData: true
      });
    } else {
      relapseDebugTimer = window.setInterval(updateRelapseDebug, 250);
    }

    updateRelapseDebug();
  }

  window.mazLastRelapseStage = function () {
    try {
      return localStorage.getItem("mazLastRelapseStage") || relapseLastStage || "";
    } catch (e) {
      return relapseLastStage || "";
    }
  };

'''

if "function startRelapseDebug()" not in s:
    if marker not in s:
        raise SystemExit("maz-ui.js makePsIcon marker not found")
    s = s.replace(marker, debug_block + marker, 1)

s = replace_once(
    s,
    '  function resetStatus() {\n    running = false;\n    succeeded = false;\n',
    '  function resetStatus() {\n    running = false;\n    succeeded = false;\n    stopRelapseDebug();\n',
    "resetStatus",
)

s = replace_once(
    s,
    '    var wrapped = function () {\n      succeeded = true;\n      running = false;\n      setStatus("GoldHEN Loaded Successfully!", "System ready.", "success");\n',
    '    var wrapped = function () {\n      succeeded = true;\n      running = false;\n      stopRelapseDebug();\n      setStatus("GoldHEN Loaded Successfully!", "System ready.", "success");\n',
    "success hook",
)

s = replace_once(
    s,
    '    succeeded = false;\n    running = true;\n    setStatus("Initializing exploit...", "Starting WebKitty exploit chain.", "running");\n',
    '    succeeded = false;\n    running = true;\n    startRelapseDebug();\n    setStatus("Initializing exploit...", "Starting WebKitty exploit chain.", "running");\n',
    "runRealJailbreak start",
)

s = replace_once(
    s,
    '    } catch (e) {\n      running = false;\n      setStatus("Jailbreak Failed", "Could not start the real WebKitty action.", "failed");\n',
    '    } catch (e) {\n      running = false;\n      stopRelapseDebug();\n      setStatus("Jailbreak Failed", "Could not start the real WebKitty action.", "failed");\n',
    "runRealJailbreak catch",
)

p.write_text(s, encoding="utf-8")


# --- Use one cache-busted Relapse module URL everywhere ---
for filename in ["includes/js/index.js", "includes/js/index-legacy.js", "exploit.html"]:
    q = Path(filename)
    if not q.exists():
        continue
    t = q.read_text(encoding="utf-8")
    t = t.replace("src/relapse/jb.js?v=10", "src/relapse/jb.js?v=12")
    t = t.replace("src/relapse/jb.js?v=11", "src/relapse/jb.js?v=12")
    q.write_text(t, encoding="utf-8")


# --- Bump PS4 AppCache manifest ---
q = Path("includes/caches/manifest/1302-1352.manifest")
t = q.read_text(encoding="utf-8")
t = t.replace("# v2.2 MAZ path fix", "# v2.3 MAZ relapse debug")
t = t.replace("../../../src/relapse/jb.js?v=10", "../../../src/relapse/jb.js?v=12")
t = t.replace("../../../src/relapse/jb.js?v=11", "../../../src/relapse/jb.js?v=12")
if "../../../includes/js/index-legacy.js" not in t and "../../../includes/js/index.js\n" in t:
    t = t.replace(
        "../../../includes/js/index.js\n",
        "../../../includes/js/index.js\n../../../includes/js/index-legacy.js\n",
        1,
    )
q.write_text(t, encoding="utf-8")


# --- Assertions ---
assert "function startRelapseDebug()" in Path("includes/maz/maz-ui.js").read_text(encoding="utf-8")
assert "mazLastRelapseStage" in Path("includes/maz/maz-ui.js").read_text(encoding="utf-8")
assert "src/relapse/jb.js?v=12" in Path("includes/js/index.js").read_text(encoding="utf-8")
assert "src/relapse/jb.js?v=12" in Path("exploit.html").read_text(encoding="utf-8")
assert "# v2.3 MAZ relapse debug" in Path("includes/caches/manifest/1302-1352.manifest").read_text(encoding="utf-8")
assert "../../../src/relapse/jb.js?v=12" in Path("includes/caches/manifest/1302-1352.manifest").read_text(encoding="utf-8")

print("MAZ Relapse debug patch applied successfully")
