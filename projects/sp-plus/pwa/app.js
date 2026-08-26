const $ = (id) => document.getElementById(id);
let approvalId = "";
let latestReport = null;

async function call(method, params = {}) {
  const response = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params }),
  });
  const payload = await response.json();
  if (!payload.ok) throw new Error(payload.error || "The Advisor service could not complete that step.");
  return payload.result;
}

function message(text, kind = "") {
  $("message").textContent = text;
  $("message").className = `message ${kind}`;
}

function setButton(id, enabled) { $(id).disabled = !enabled; }

async function refresh() {
  try {
    const result = await call("get_printer_state");
    const snapshot = result.snapshot;
    const printer = snapshot.printer;
    $("status-badge").textContent = printer.state === "online" ? "Online" : "Needs attention";
    $("status-badge").className = `badge ${printer.state === "online" ? "good" : "warning"}`;
    $("status-copy").textContent = printer.state === "online" ? "The test printer is connected." : "The test printer is offline. A reconnect can be attempted safely.";
    $("facts").innerHTML = `<dt>Printer</dt><dd>${printer.name}</dd><dt>Print service</dt><dd>${snapshot.print_service.state}</dd><dt>Error</dt><dd>${printer.error_code || "None"}</dd>`;
  } catch (error) { message(error.message, "error"); }
}

$("diagnose").addEventListener("click", async () => {
  try {
    const result = await call("diagnose_printer");
    $("diagnosis").classList.remove("hidden");
    $("diagnosis-copy").textContent = result.summary;
    $("sanitized-request").textContent = JSON.stringify(result.sanitized_request, null, 2);
    setButton("approve", true);
    message("Diagnosis complete. Review the explanation, then approve the reconnect if you want to continue.");
  } catch (error) { message(error.message, "error"); }
});

$("approve").addEventListener("click", async () => {
  try {
    const result = await call("approve_remediation");
    approvalId = result.approval_id;
    setButton("reconnect", true);
    message("Approval recorded for this reconnect only. Select Reconnect printer to run it.");
  } catch (error) { message(error.message, "error"); }
});

$("reconnect").addEventListener("click", async () => {
  try {
    const result = await call("run_remediation", { approval_id: approvalId });
    setButton("verify", true);
    message(`${result.message} Playbook integrity verified.` , "success");
    await refresh();
  } catch (error) { message(error.message, "error"); }
});

$("verify").addEventListener("click", async () => {
  try {
    const result = await call("verify_printer");
    message(result.verified ? "Test page verified. The printer workflow is complete." : "The test page could not be verified.", result.verified ? "success" : "error");
    await refresh();
  } catch (error) { message(error.message, "error"); }
});

$("report").addEventListener("click", async () => {
  try {
    latestReport = await call("report");
    $("report-panel").classList.remove("hidden");
    $("report-output").textContent = JSON.stringify(latestReport, null, 2);
    message("Evidence record generated. It contains the technical history and action result, not client data.", "success");
  } catch (error) { message(error.message, "error"); }
});

$("download").addEventListener("click", () => {
  if (!latestReport) return;
  const blob = new Blob([JSON.stringify(latestReport, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "advisor-security-evidence.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

refresh();
