// -----------------------------
// Global Variables
// -----------------------------
let selectedTemplate = null;
let appliedTemplateData = null;

// -----------------------------
// Embedded Templates (with render function)
// -----------------------------
const EMBEDDED_TEMPLATES = {
  "sit-azure-deployment": {
    name: "sit-azure-deployment",
    description: "SIT Azure environment deployment template",
    fields: {
      myenvironment: "sit",
      k8s_controller_type: "job",
      agent_label: "redhat-azure-03-devinfra",
      image_name: "$Enter image name",
      acr_name: "scbseaacr001nonprod",
      aks_cluster_name: "$Enter aks cluster name",
      resource_group: "RG-SEA-INTN-003",
      resource_id: "$Enter resource id",
      client_id: "$Enter client id",
      namespace: "wplan-sit2",
      release_name: "$Enter release name",
      chart_repo: "scbharborlibrary",
      chart_name: "scb-common-job",
      chart_version: "$Enter chart version",
      value_file_path: "$Enter value file path",
      enable_uninstall: "$Enable automatic uninstall (true/false)",
      email_receiver: "$Enter notification email"
    },
    render: (vals) => {
      return `library 'lib-deploy-helm@v2.6.1'
runhelmJobToAKS(
    myenvironment: '${vals.myenvironment || "sit"}',
    k8s_controller_type: '${vals.k8s_controller_type || "job"}',
    agent_label: '${vals.agent_label || "redhat-azure-03-devinfra"}',
    image_name: '${vals.image_name}',
    acr_name: '${vals.acr_name || "scbseaacr001nonprod"}',
    aks_cluster_name: '${vals.aks_cluster_name}',
    resource_group: '${vals.resource_group || "RG-SEA-INTN-003"}',
    resource_id: '${vals.resource_id}',
    client_id: '${vals.client_id}',
    namespace: '${vals.namespace || "wplan-sit2"}',
    release_name: '${vals.release_name}',
    chart_repo: '${vals.chart_repo || "scbharborlibrary"}',
    chart_name: '${vals.chart_name || "scb-common-job"}',
    chart_version: '${vals.chart_version}',
    value_file_path: '${vals.value_file_path}',
    enable_uninstall: '${vals.enable_uninstall}',
    email_receiver: '${vals.email_receiver}'
)`;
    }
  },

  "deployADFContainerAppJob-template": {
    name: "deployADFContainerAppJob-template",
    description: "ADF Container App Job deployment template",
    fields: {
      ENV: "$Select environment (dev/sit/uat/prod)",
      ADF_TRIGGER_START_TIME: "$Enter trigger start time (yyyy-MM-ddTHH:mm:ss)",
      ADF_TRIGGER_FREQUENCY: "$Enter frequency (Minute/Hour/Day/Week/Month)",
      ADF_TRIGGER_INTERVAL: "$Enter interval (number)",
      CONTAINER_APP_JOB_COMMAND: "$Optional: override container job command",
      CONTAINER_APP_JOB_ARGS: "$Optional: override container job args",
      CONTAINER_APP_JOB_ENV_VARS: "$Optional: job environment variables"
    },
    render: (vals) => {
      const env = vals.ENV || "dev";
      const ENV_UP = env.toUpperCase();

      let out = `library 'lib-deploy-azure@v1.35.0'
deployADFContainerAppJob(
    JENKINS_EXECUTION_IMAGE: 'harbordev.se.scb.co.th/library/azure-cli:2.62.0',
    JENKINSFILE_GIT_TYPE: 'PT_TAG',

    DEPLOY_ENV: '${env}',
    AGENT_MSI: 'ec557dbd-1072-4b53-8455-4596a68a9a6e',

    SUBSCRIPTION_ID: '7148d64b-54cf-4746-84be-f56a853b5281',
    RESOURCE_GROUP: 'RG-SEA-LVL-${ENV_UP}-001',

    AKV_NAME: 'scblvlseaakv001${env}',
    AKV_SPLUNK_SECRET_NAME: 'test',

    ADF_NAME: 'scblvlseaadf001${env}',
    ADF_PIPELINE_NAME: 'LVL_pipeline_common-data-management',
    ADF_CREDENTIAL_APPROLE: 'LVLAppRole',
    ADF_PARAMETERS: '{ \\"datetime_timezone\\": { \\"type\\": \\"string\\", \\"defaultValue\\": \\"SE Asia Standard Time\\" }, \\"datetime_format\\": { \\"type\\": \\"string\\", \\"defaultValue\\": \\"yyyy-MM-dd_HH:mm:ss\\" } }',
    ADF_IR_NAME: 'self-hosted-ir',

    CONTAINER_APP_JOB_NAME: '${env}-common-data-management',`;

      if (vals.CONTAINER_APP_JOB_COMMAND) {
        out += `\n    CONTAINER_APP_JOB_COMMAND: '${vals.CONTAINER_APP_JOB_COMMAND}',`;
      }
      if (vals.CONTAINER_APP_JOB_ARGS) {
        out += `\n    CONTAINER_APP_JOB_ARGS: '${vals.CONTAINER_APP_JOB_ARGS}',`;
      }
      if (vals.CONTAINER_APP_JOB_ENV_VARS) {
        out += `\n    CONTAINER_APP_JOB_ENV_VARS: '${vals.CONTAINER_APP_JOB_ENV_VARS}',`;
      }

      out += `

    ADF_TRIGGER_NAME: 'LVL_trigger_batch-common-data-management',
    ADF_TRIGGER_START_TIME: '${vals.ADF_TRIGGER_START_TIME || "2025-03-13T00:00:00"}',
    ADF_TRIGGER_FREQUENCY: '${vals.ADF_TRIGGER_FREQUENCY || "Day"}',
    ADF_TRIGGER_INTERVAL: '${vals.ADF_TRIGGER_INTERVAL || "1"}'
)`;
      return out;
    }
  },

  "nodejs-app-template": {
    name: "nodejs-app-template",
    description: "Node.js application deployment template",
    fields: {
      app_name: "$Enter application name",
      app_port: "3000",
      node_version: "18",
      environment: "$Enter environment (dev, staging, prod)",
      database_url: "$Enter database connection URL (optional)",
      build_command: "npm run build",
      start_command: "npm start"
    },
    render: (vals) => {
      return `// Node.js Deployment Configuration
module.exports = {
    app_name: '${vals.app_name}',
    app_port: ${vals.app_port || 3000},
    node_version: '${vals.node_version || "18"}',
    environment: '${vals.environment}',
    database_url: '${vals.database_url || ""}',
    build_command: '${vals.build_command || "npm run build"}',
    start_command: '${vals.start_command || "npm start"}'
};`;
    }
  }
};

// -----------------------------
// Utilities
// -----------------------------
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function showModal(modalId) {
  document.getElementById(modalId).classList.add("show");
  document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.remove("show");
  document.body.style.overflow = '';
}

function isDynamicField(value) {
  return typeof value === "string" && value.trim().startsWith("$");
}

// -----------------------------
// File Selection Functions
// -----------------------------
function ensureSections() {
  const root = document.querySelector('#outputArea') || document.body;
  if (!document.getElementById('generatedCommandSection')) {
    const sec = document.createElement('section');
    sec.id = 'generatedCommandSection';
    sec.style.margin = '16px 0';
    sec.innerHTML = `
      <h3 class="section-title">File Creation Command (for paste into shell)</h3>
      <div class="actions" style="margin:8px 0;">
        <button type="button" class="btn btn-secondary" onclick="exportCommand()">Export</button>
        <button type="button" class="btn btn-primary" onclick="copyFileCreationCommand()">Copy</button>
      </div>
      <pre id="fileCreationOutput" style="background:#111; color:#eee; padding:12px; border-radius:6px; overflow:auto;">
# Waiting for template...
</pre>
    `;
    root.appendChild(sec);
  }
}

function generateFileCreationCommand() {
  if (!appliedTemplateData) return;

  const tpl = EMBEDDED_TEMPLATES[appliedTemplateData.name];
  const vals = appliedTemplateData.values;

  if (!tpl || !tpl.render) return;

  // render เนื้อหาของไฟล์จาก template
  const fileContent = tpl.render(vals);

  // derive path จาก environment + project
  const environment = vals.myenvironment || vals.environment || vals.ENV || "dev";
  const projectName = vals.image_name || vals.app_name || appliedTemplateData.name;
  const cleanProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');

  const folderPath = `./deployments/${environment}/${cleanProjectName}`;
  const fileName = `${appliedTemplateData.name}.groovy`;
  const fullPath = `${folderPath}/${fileName}`;

  // shell command (ไม่มี shebang เพราะเอาไว้ paste ตรง ๆ)
  const createCommand = `# Create directory structure
mkdir -p ${folderPath}

# Create the deployment file
cat > ${fullPath} <<'EOF'
${fileContent}
EOF

# Set file permissions
chmod 644 ${fullPath}

echo "✅ File created successfully at: ${fullPath}"
echo "📁 Folder: ${folderPath}"
echo "📄 File: ${fileName}"`;

  document.getElementById("fileCreationOutput").textContent = createCommand;
}



function copyCommand() {
  const pre = document.getElementById('commandOutput');
  if (!pre) return;
  const text = pre.innerText.trim(); // ดึงเฉพาะเนื้อหาใน <pre>
  navigator.clipboard.writeText(text).then(() => {
    alert("Command copied to clipboard!");
  }).catch(err => {
    console.error("Failed to copy: ", err);
  });
}




function addFilePattern() {
  const container = document.getElementById("filePatterns");
  const div = document.createElement("div");
  div.className = "operation-item";
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="File pattern (e.g., *.groovy)" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="removeFilePattern(this)">❌</button>
  `;
  container.appendChild(div);
}

function removeFilePattern(btn) {
  btn.parentElement.remove();
  generateCommand();
}

function addContentPattern() {
  const container = document.getElementById("contentPatterns");
  const div = document.createElement("div");
  div.className = "operation-item";
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="Text content to search for" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="removeContentPattern(this)">❌</button>
  `;
  container.appendChild(div);
}

function removeContentPattern(btn) {
  btn.parentElement.remove();
  generateCommand();
}

function addDeleteOperation() {
  const container = document.getElementById("deleteOperations");
  const div = document.createElement("div");
  div.className = "operation-item";
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="Pattern to delete (e.g., git_params:)" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>
  `;
  container.appendChild(div);
}

function addReplaceOperation() {
  const container = document.getElementById("replaceOperations");
  const div = document.createElement("div");
  div.className = "operation-item";
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="Find text" oninput="generateCommand()">
    <span style="color: #ff6b35; font-weight: bold;">→</span>
    <input type="text" class="operation-input" placeholder="Replace with" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>
  `;
  container.appendChild(div);
}

function removeOperation(btn) {
  btn.parentElement.remove();
  generateCommand();
}

function handleSelectionMethodChange() {
  const method = document.querySelector("input[name='selectionMethod']:checked").value;
  document.getElementById("patternGroup").style.display = method === "pattern" ? "block" : "none";
  document.getElementById("contentGroup").style.display = method === "content" ? "block" : "none";
  generateCommand();
}

// -----------------------------
// Command Generator  (FIXED)
// -----------------------------
function generateCommand() {
  const basePath = document.getElementById("basePath").value.trim() || ".";
  const selectionMethod = document.querySelector("input[name='selectionMethod']:checked").value;
  const includeSubdirs = document.getElementById("includeSubdirs").checked;
  const filesOnly = document.getElementById("filesOnly").checked;
  const createBackup = document.getElementById("createBackup").checked;
  const useRegex = document.getElementById("useRegex").checked;
  const caseInsensitive = document.getElementById("caseInsensitive").checked;

  let command = "";

  // -----------------------------
  // File pattern mode
  // -----------------------------
  if (selectionMethod === "pattern") {
    const patterns = Array.from(document.querySelectorAll("#filePatterns .operation-input"))
      .map(i => i.value.trim())
      .filter(v => v);

    command = `find ${basePath}`;
    if (!includeSubdirs) command += " -maxdepth 1";

    if (patterns.length > 0) {
      if (patterns.length === 1) {
        command += ` -name "${patterns[0]}"`;
      } else {
        const patternConditions = patterns.map(p => `-name "${p}"`).join(" -o ");
        command += ` \\( ${patternConditions} \\)`;
      }
    }

    if (filesOnly) command += " -type f";
  } 
  // -----------------------------
  // Content search mode
  // -----------------------------
  else {
    const contents = Array.from(document.querySelectorAll("#contentPatterns .operation-input"))
      .map(i => i.value.trim())
      .filter(v => v);

    if (contents.length === 0) {
      document.getElementById("commandOutput").textContent = "# Please enter search text";
      return;
    }

    command = `find ${basePath}`;
    if (!includeSubdirs) command += " -maxdepth 1";
    if (filesOnly) command += " -type f";

    let grepCmd = " | xargs grep -l";
    if (caseInsensitive) grepCmd += " -i";
    if (useRegex) grepCmd += " -E";

    if (contents.length === 1) {
      grepCmd += ` "${contents[0]}"`;
    } else {
      grepCmd += ` -e "${contents.join('" -e "')}"`;
    }

    command += grepCmd;
  }

  // -----------------------------
  // Delete + Replace Operations
  // -----------------------------
  const deletePatterns = Array.from(document.querySelectorAll("#deleteOperations .operation-input"))
    .map(i => i.value.trim())
    .filter(v => v);

  const replaceOps = Array.from(document.querySelectorAll("#replaceOperations .operation-item"));
  const replaceRules = [];
  replaceOps.forEach(op => {
    const inputs = op.querySelectorAll(".operation-input");
    if (inputs.length >= 2) {
      const find = inputs[0].value.trim();
      const replace = inputs[1].value.trim();
      if (find) replaceRules.push({ find, replace });
    }
  });

  if (deletePatterns.length > 0 || replaceRules.length > 0) {
    const backupFlag = createBackup ? " -i.backup" : " -i \"\" -E";

    if (selectionMethod === "content") {
      let sedCmd = " | xargs sed" + backupFlag;

      deletePatterns.forEach(pattern => {
        if (useRegex) {
          sedCmd += ` -e "/${pattern}/d"`;
        } else {
          const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          sedCmd += ` -e "/^${escaped}/d"`;
        }
      });

      replaceRules.forEach(rule => {
        // match เฉพาะ sit ตัวเล็กเท่านั้น
        const flags = caseInsensitive ? "gI" : "g";
        sedCmd += ` -e "s/([^A-Za-z0-9_])${rule.find}([^A-Za-z0-9_])/\\1${rule.replace}\\2/${flags}"`;
      });

      command += sedCmd;
    } else {
      let sedCmd = " -exec sed" + backupFlag;

      deletePatterns.forEach(pattern => {
        if (useRegex) {
          sedCmd += ` -e "/${pattern}/d"`;
        } else {
          const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          sedCmd += ` -e "/^${escaped}/d"`;
        }
      });

      replaceRules.forEach(rule => {
        const flags = caseInsensitive ? "gI" : "g";
        sedCmd += ` -e "s/([^A-Za-z0-9_])${rule.find}([^A-Za-z0-9_])/\\1${rule.replace}\\2/${flags}"`;
      });

      sedCmd += " {} \\;";
      command += sedCmd;
    }
  }

  document.getElementById("commandOutput").textContent = command;
}


// -----------------------------
// File Creation Command Generator
// -----------------------------
function generateFileCreationCommand() {
  if (!appliedTemplateData) return;

  const tpl = EMBEDDED_TEMPLATES[appliedTemplateData.name];
  const vals = appliedTemplateData.values;

  if (!tpl || !tpl.render) return;

  // Generate the file content
  const fileContent = tpl.render(vals);

  // Determine folder path and filename
  const environment = vals.myenvironment || vals.environment || vals.ENV || "dev";
  const projectName = vals.image_name || vals.app_name || appliedTemplateData.name;
  const cleanProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');

  // Create folder structure
  const folderPath = `./deployments/${environment}/${cleanProjectName}`;
  const fileName = `${appliedTemplateData.name}.groovy`;
  const fullPath = `${folderPath}/${fileName}`;

  // Generate the complete shell command
  const createCommand = `#!/bin/bash
# Auto-generated deployment file creation command
# Template: ${appliedTemplateData.name}
# Environment: ${environment}
# Project: ${cleanProjectName}

# Create directory structure
mkdir -p ${folderPath}

# Create the deployment file
cat > ${fullPath} << 'HEREDOC_EOF'
${fileContent}
HEREDOC_EOF

# Set file permissions
chmod 644 ${fullPath}

echo "✅ File created successfully at: ${fullPath}"
echo "📁 Folder: ${folderPath}"
echo "📄 File: ${fileName}"`;

  const outputArea = document.getElementById("fileCreationOutput");
  if (outputArea) {
    outputArea.textContent = createCommand;
  }

  const fileList = document.getElementById("fileList");
  const pathInfo = document.createElement("div");
  pathInfo.className = "file-item";
  pathInfo.style.background = "#e8f5e9";
  pathInfo.style.borderLeft = "4px solid #4caf50";
  pathInfo.innerHTML = `<strong>📁 Output Path:</strong> ${fullPath}`;
  fileList.insertBefore(pathInfo, fileList.firstChild);
}

function copyFileCreationCommand() {
  const cmd = document.getElementById("fileCreationOutput")?.textContent;
  if (!cmd) {
    showToast("No file creation command available");
    return;
  }
  navigator.clipboard.writeText(cmd).then(() => {
    showToast("File creation command copied! Paste it in your terminal.");
  });
}

function executeFileCreation() {
  showToast("⚠️ Please copy the command and run it in your terminal");
}

// function copyCommand() {
//   const pre = document.getElementById('commandOutput');
//   if (!pre) return;
//   const text = pre.innerText; // เอาเฉพาะข้อความใน <pre>
//   navigator.clipboard.writeText(text).then(() => {
//     alert("Command copied to clipboard!");
//   }).catch(err => {
//     console.error("Failed to copy: ", err);
//   });
// }


function previewFiles() {
  const fileList = document.getElementById("fileList");
  const selectionMethod = document.querySelector("input[name='selectionMethod']:checked").value;

  let mockFiles = [];

  if (selectionMethod === "pattern") {
    const patterns = Array.from(document.querySelectorAll("#filePatterns .operation-input"))
      .map(i => i.value.trim()).filter(v => v);

    patterns.forEach(pattern => {
      mockFiles.push(`./example/${pattern.replace(/\*/g, "demo")}`);
      mockFiles.push(`./config/${pattern.replace(/\*/g, "test")}`);
    });

    if (mockFiles.length === 0) {
      mockFiles.push("# No file patterns provided");
    }
  } else {
    const contents = Array.from(document.querySelectorAll("#contentPatterns .operation-input"))
      .map(i => i.value.trim()).filter(v => v);

    contents.forEach(content => {
      mockFiles.push(`./pipeline/jenkinsfile.groovy (contains: ${content})`);
      mockFiles.push(`./scripts/build.groovy (contains: ${content})`);
    });

    if (mockFiles.length === 0) {
      mockFiles.push("# No search text provided");
    }
  }

  fileList.innerHTML = mockFiles.map(f => `<div class="file-item">${f}</div>`).join("");
  document.getElementById("previewSection").style.display = "block";
}

async function exportCommand() {
  if (!appliedTemplateData) {
    const cmd = document.getElementById("commandOutput").textContent;
    if (!cmd || cmd.trim() === '' || cmd.startsWith('#')) {
      showToast("No command to export");
      return;
    }

    const content = `#!/bin/bash\n# Generated Shell Command\n\n${cmd}\n`;
    const filename = "shell-command.sh";

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "Shell Script",
              accept: { "text/x-sh": [".sh"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        showToast("Exported shell command!");
      } catch (err) {
        console.error(err);
        showToast("Export cancelled.");
      }
    } else {
      // Fallback
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast("⚠️ Browser does not support file picker. File saved to default downloads folder.");
    }
    return;
  }

  const tpl = EMBEDDED_TEMPLATES[appliedTemplateData.name];
  const vals = appliedTemplateData.values;
  if (!tpl || !tpl.render) {
    showToast("No render() found for this template");
    return;
  }

  const output = tpl.render(vals);
  const filename = appliedTemplateData.name + ".groovy";

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "Groovy Script",
            accept: { "text/plain": [".groovy"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(output);
      await writable.close();
      showToast("Exported as Groovy script!");
    } catch (err) {
      console.error(err);
      showToast("Export cancelled.");
    }
  } else {
    // Fallback
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast("⚠️ Browser does not support file picker. File saved to default downloads folder.");
  }
}



// -----------------------------
// Template Management
// -----------------------------
function showModeSelection() {
  showModal("templateSelectionModal");
  loadTemplates();
}

function loadTemplates() {
  const grid = document.getElementById("templatesGrid");
  grid.innerHTML = "<div class='loading'>Loading templates...</div>";

  setTimeout(() => {
    const templates = Object.values(EMBEDDED_TEMPLATES);
    renderTemplateCards(templates);
  }, 500);
}

function renderTemplateCards(templates) {
  const grid = document.getElementById("templatesGrid");
  grid.innerHTML = "";

  if (templates.length === 0) {
    grid.innerHTML = "<div class='loading'>No templates found.</div>";
    return;
  }

  templates.forEach((tpl, idx) => {
    const card = document.createElement("div");
    card.className = "template-card";
    card.dataset.index = idx;
    card.onclick = () => selectTemplate(card, tpl);

    card.innerHTML = `
      <div class="template-name">${tpl.name}</div>
      <div class="template-description">${tpl.description || ""}</div>
      <div class="template-fields"><strong>Fields:</strong> ${Object.keys(tpl.fields).length}</div>
    `;
    grid.appendChild(card);
  });
}

function selectTemplate(card, tpl) {
  document.querySelectorAll(".template-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedTemplate = tpl;
  document.getElementById("proceedBtn").disabled = false;
}

function proceedWithTemplate() {
  if (!selectedTemplate) return;
  hideModal("templateSelectionModal");
  showDynamicForm(selectedTemplate);
}

function backToModeSelection() {
  hideModal("dynamicFormModal");
  showModal("templateSelectionModal");
}

function backToTemplateSelection() {
  hideModal("dynamicFormModal");
  showModal("templateSelectionModal");
}

function showDynamicForm(tpl) {
  showModal("dynamicFormModal");
  document.getElementById("formTitle").textContent = `📝 ${tpl.name}`;
  document.getElementById("templateInfo").innerHTML = `
    <h4>${tpl.name}</h4>
    <p>${tpl.description}</p>
  `;

  const form = document.getElementById("dynamicForm");
  form.innerHTML = "";

  Object.entries(tpl.fields).forEach(([key, label]) => {
    if (!isDynamicField(label)) return;

    const field = document.createElement("div");
    field.className = "form-field";

    let inputElement = "";

    if (key === "ENV") {
      inputElement = `
        <select id="${key}" name="${key}">
          <option value="dev">dev</option>
          <option value="sit">sit</option>
          <option value="uat">uat</option>
          <option value="prod">prod</option>
        </select>
      `;
    } else if (key.includes("email")) {
      inputElement = `<input type="email" id="${key}" name="${key}" placeholder="${label}" />`;
    } else if (key.includes("enable") || label.includes("true/false")) {
      inputElement = `
        <select id="${key}" name="${key}">
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      `;
    } else if (label.length > 80) {
      inputElement = `<textarea id="${key}" name="${key}" placeholder="${label}"></textarea>`;
    } else {
      inputElement = `<input type="text" id="${key}" name="${key}" placeholder="${label}" />`;
    }

    field.innerHTML = `
      <label for="${key}">${formatFieldLabel(key)}</label>
      ${inputElement}
      <div class="help-text">${label}</div>
    `;
    form.appendChild(field);
  });
}

function formatFieldLabel(fieldKey) {
  return fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function applyTemplate() {
  const form = document.getElementById("dynamicForm");
  const formData = new FormData(form);
  const values = {};

  formData.forEach((val, key) => {
    values[key] = val;
  });

  appliedTemplateData = {
    name: selectedTemplate.name,
    description: selectedTemplate.description,
    values
  };

  ensureSections();
  const environment = values.myenvironment || values.environment || values.ENV;
  const imageName = values.image_name;
  const appName = values.app_name;

  const fileContainer = document.getElementById("filePatterns");
  fileContainer.innerHTML = "";

  if (imageName) {
    addFilePatternWithValue(fileContainer, `*${imageName}*.groovy`);
    addFilePatternWithValue(fileContainer, `*${imageName}*.yaml`);
  }

  if (appName) {
    addFilePatternWithValue(fileContainer, `*${appName}*.groovy`);
  }

  if (selectedTemplate.name.includes("azure") || selectedTemplate.name.includes("helm")) {
    addFilePatternWithValue(fileContainer, "*.yaml");
    addFilePatternWithValue(fileContainer, "values*.yaml");
  }

  const deleteContainer = document.getElementById("deleteOperations");
  deleteContainer.innerHTML = "";
  addDeletePatternWithValue(deleteContainer, "# TODO: Remove this");
  addDeletePatternWithValue(deleteContainer, "deprecated:");

  const replaceContainer = document.getElementById("replaceOperations");
  replaceContainer.innerHTML = "";
  if (environment && environment !== "dev") {
    addReplaceRuleWithValue(replaceContainer, "dev", environment);
  }

  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";
  Object.entries(values).forEach(([key, val]) => {
    const item = document.createElement("div");
    item.className = "file-item";
    item.textContent = `${key}: ${val}`;
    fileList.appendChild(item);
  });
  document.getElementById("previewSection").style.display = "block";

  hideModal("dynamicFormModal");
  generateCommand();
  generateFileCreationCommand();
  showToast("Template applied! Generated shell command and file creation command.");
}

function addFilePatternWithValue(container, value) {
  const div = document.createElement("div");
  div.className = "operation-item";
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="File pattern (e.g., *.groovy)" value="${value}" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="removeFilePattern(this)">❌</button>
  `;
  container.appendChild(div);
}

function addDeletePatternWithValue(container, value) {
  const div = document.createElement("div");
  div.className = "operation-item";
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="Pattern to delete (e.g., git_params:)" value="${value}" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>
  `;
  container.appendChild(div);
}

function addReplaceRuleWithValue(container, find, replace) {
  const div = document.createElement("div");
  div.className = "operation-item";
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="Find text" value="${find}" oninput="generateCommand()">
    <span style="color: #ff6b35; font-weight: bold;">→</span>
    <input type="text" class="operation-input" placeholder="Replace with" value="${replace}" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>
  `;
  container.appendChild(div);
}

// -----------------------------
// Save / Load Templates
// -----------------------------
function saveTemplate() {
  if (!appliedTemplateData) {
    showToast("No applied template to save!");
    return;
  }

  let saved = JSON.parse(localStorage.getItem("savedTemplates") || "[]");

  const existingIndex = saved.findIndex(t => t.name === appliedTemplateData.name);
  if (existingIndex >= 0) {
    saved[existingIndex] = appliedTemplateData;
  } else {
    saved.push(appliedTemplateData);
  }

  localStorage.setItem("savedTemplates", JSON.stringify(saved));
  renderSavedTemplates();
  showToast(`Saved template: ${appliedTemplateData.name}`);
}

function renderSavedTemplates() {
  const list = document.getElementById("templatesList");
  list.innerHTML = "";

  let saved = JSON.parse(localStorage.getItem("savedTemplates") || "[]");
  if (saved.length === 0) {
    list.innerHTML = "<div class='loading'>No saved templates.</div>";
    return;
  }

  saved.forEach(tpl => {
    const item = document.createElement("div");
    item.className = "template-item";

    item.innerHTML = `
      <div class="template-info">
        <h4>${tpl.name}</h4>
        <p>${tpl.description || ""}</p>
      </div>
      <div>
        <button class="btn btn-primary" onclick="loadSavedTemplate('${tpl.name}')">Load</button>
        <button class="btn btn-secondary" onclick="exportSavedTemplate('${tpl.name}')">Export</button>
        <button class="btn btn-remove" onclick="deleteSavedTemplate('${tpl.name}')">Delete</button>
      </div>
    `;

    list.appendChild(item);
  });
}

function loadSavedTemplate(name) {
  let saved = JSON.parse(localStorage.getItem("savedTemplates") || "[]");
  const tpl = saved.find(t => t.name === name);
  if (!tpl) return;

  selectedTemplate = tpl;
  showDynamicForm(tpl);

  setTimeout(() => {
    Object.entries(tpl.values).forEach(([key, val]) => {
      const input = document.getElementById(key);
      if (input) input.value = val;
    });
  }, 100);
}

function deleteSavedTemplate(name) {
  if (confirm(`Are you sure you want to delete template "${name}"?`)) {
    let saved = JSON.parse(localStorage.getItem("savedTemplates") || "[]");
    saved = saved.filter(t => t.name !== name);
    localStorage.setItem("savedTemplates", JSON.stringify(saved));
    renderSavedTemplates();
    showToast(`Deleted template: ${name}`);
  }
}

function exportSavedTemplate(name) {
  let saved = JSON.parse(localStorage.getItem("savedTemplates") || "[]");
  const tpl = saved.find(t => t.name === name);
  if (!tpl) return;

  const vals = tpl.values;
  const templateDef = EMBEDDED_TEMPLATES[tpl.name];

  let output = "";

  if (templateDef && templateDef.render) {
    output = templateDef.render(vals);
  } else {
    output = `library 'lib-deploy-helm@v2.6.1'\nrunhelmJobToAKS(\n`;
    Object.entries(vals).forEach(([key, val], idx, arr) => {
      const comma = idx === arr.length - 1 ? "" : ",";
      output += `    ${key}: '${val}'${comma}\n`;
    });
    output += `)\n`;
  }

  const blob = new Blob([output], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = tpl.name + ".groovy";
  a.click();

  URL.revokeObjectURL(url);
  showToast(`Exported saved template: ${tpl.name}`);
}

// -----------------------------
// Modal Management
// -----------------------------
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('show');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal.show');
    if (openModal) {
      openModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }
});

// -----------------------------
// Initialize
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
    ensureSections();
    renderSavedTemplates();
    generateCommand();

  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('operation-input') || e.target.id === 'basePath') {
      generateCommand();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox' || e.target.type === 'radio') {
      generateCommand();
    }
  });
});
