function splitPath(basePath) {
  const parts = basePath.split('/').filter(Boolean);
//   if (parts.length < 3) return { cd: basePath, relative: '' };
//   const cdPath = '/' + parts.slice(0, 3).join('/');
//   const relativePath = parts.slice(3).join('/') || '.';
//   return { cd: cdPath, relative: relativePath };
}
// find /Users/t.pannaporn.boonsangsuk/test1/helmKind -type f | xargs grep prom
function generateCommand() {
  const basePath = document.getElementById('basePath').value || '.';
  const selectionMethod = document.querySelector('input[name="selectionMethod"]:checked').value;
  const includeSubdirs = document.getElementById('includeSubdirs').checked;
  const filesOnly = document.getElementById('filesOnly').checked;

  // options
  const createBackup = document.getElementById('createBackup').checked;
  const useRegex = document.getElementById('useRegex').checked;
  const caseInsensitive = document.getElementById('caseInsensitive').checked;
  const verboseOutput = document.getElementById('verboseOutput').checked;

  let command = "";

  if (selectionMethod === "pattern") {
    const patterns = Array.from(document.querySelectorAll("#filePatterns .operation-input"))
      .map(i => i.value).filter(Boolean);

    command = `find ${basePath}`;
    if (!includeSubdirs) command += " -maxdepth 1";
    if (patterns.length > 0) {
      const joined = patterns.map(p => `-name "${p}"`).join(" -o ");
      command += ` \\( ${joined} \\)`;
    }
    if (filesOnly) command += " -type f";
    if (verboseOutput) command += " -print";

  } else {
    const texts = Array.from(document.querySelectorAll("#contentPatterns .operation-input"))
      .map(i => i.value).filter(Boolean);

    if (texts.length === 0) {
      document.getElementById("commandOutput").textContent = "# Please enter search text";
      return;
    }

    command = `find ${basePath} -type f | xargs grep -l`;
    if (caseInsensitive) command += " -i";
    if (verboseOutput) command += " -n";
    texts.forEach(t => {
      command += ` -e "${t}"`;
    });
  }

  // Delete and replace rules
  const deletes = Array.from(document.querySelectorAll("#deleteOperations .operation-input"))
    .map(i => i.value).filter(Boolean);
  const replaces = [];
  document.querySelectorAll("#replaceOperations .operation-item").forEach(item => {
    const [f, r] = item.querySelectorAll("input");
    if (f.value || r.value) replaces.push({ find: f.value, replace: r.value });
  });

  if (deletes.length > 0 || replaces.length > 0) {
    command += " | xargs sed";

    if (createBackup) {
      command += " -i.backup";
    } else {
      command += " -i ''";
    }

    deletes.forEach(p => {
      if (useRegex) {
        command += ` -e "/${p}/d"`;
      } else {
        const literal = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        command += ` -e "/^${literal}/d"`;
      }
    });

    replaces.forEach(r => {
      if (caseInsensitive) {
        command += ` -e "s/${r.find}/${r.replace}/gI"`;
      } else {
        command += ` -e "s/${r.find}/${r.replace}/g"`;
      }
    });
  }

  document.getElementById("commandOutput").textContent = command;
}


    function addFilePattern() {
    const container = document.getElementById('filePatterns');
    const div = document.createElement('div');
    div.className = 'operation-item';
    div.innerHTML = `<input type="text" class="operation-input" placeholder="File pattern" oninput="generateCommand()">
                    <button type="button" class="btn btn-remove" onclick="removeFilePattern(this)">❌</button>`;
    container.appendChild(div);
    }

    function removeFilePattern(btn) {
    if (document.querySelectorAll('#filePatterns .operation-item').length > 1) {
        btn.parentElement.remove();
        generateCommand();
    }
    }

    function addContentPattern() {
    const container = document.getElementById('contentPatterns');
    const div = document.createElement('div');
    div.className = 'operation-item';
    div.innerHTML = `<input type="text" class="operation-input" placeholder="Text content" oninput="generateCommand()">
                    <button type="button" class="btn btn-remove" onclick="removeContentPattern(this)">❌</button>`;
    container.appendChild(div);
    }

    function removeContentPattern(btn) {
    if (document.querySelectorAll('#contentPatterns .operation-item').length > 1) {
        btn.parentElement.remove();
        generateCommand();
    }
    }

    function addDeleteOperation() {
    const container = document.getElementById('deleteOperations');
    const div = document.createElement('div');
    div.className = 'operation-item';
    div.innerHTML = `<input type="text" class="operation-input" placeholder="Pattern to delete" oninput="generateCommand()">
                    <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>`;
    container.appendChild(div);
    }

    function addReplaceOperation() {
    const container = document.getElementById('replaceOperations');
    const div = document.createElement('div');
    div.className = 'operation-item';
    div.innerHTML = `<input type="text" class="operation-input" placeholder="Find text" oninput="generateCommand()">
                    <span style="color:#ff6b35;font-weight:bold;">→</span>
                    <input type="text" class="operation-input" placeholder="Replace with" oninput="generateCommand()">
                    <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>`;
    container.appendChild(div);
    }

    function removeOperation(btn) {
    if (btn.parentElement.parentElement.children.length > 1) {
        btn.parentElement.remove();
        generateCommand();
    }
    }

    function handleSelectionMethodChange() {
    const sel = document.querySelector('input[name="selectionMethod"]:checked').value;
    document.getElementById('patternGroup').style.display = sel === 'pattern' ? 'block' : 'none';
    document.getElementById('contentGroup').style.display = sel === 'content' ? 'block' : 'none';
    generateCommand();
    }

    function copyCommand() {
    navigator.clipboard.writeText(document.getElementById('commandOutput').textContent).then(() => showToast("Command copied!"));
    }

    function previewFiles() {
        const previewSection = document.getElementById("previewSection");
        const fileList = document.getElementById("fileList");
        const selectionMethod = document.querySelector('input[name="selectionMethod"]:checked').value;

        let mockFiles = [];

        if (selectionMethod === "pattern") {
            // ดึง patterns จาก input
            const patterns = Array.from(document.querySelectorAll("#filePatterns .operation-input"))
            .map(i => i.value).filter(Boolean);

            patterns.forEach(p => {
                mockFiles.push(`./example/${p.replace("*", "demo")}`);
            });
            if (mockFiles.length === 0) {
            mockFiles.push("# No file patterns provided");
            }

        } else {
            // ดึง content search words
            const texts = Array.from(document.querySelectorAll("#contentPatterns .operation-input"))
            .map(i => i.value).filter(Boolean);

            texts.forEach(t => {
            mockFiles.push(`./pipeline/jenkinsfile.groovy    (contains: ${t})`);
            mockFiles.push(`./scripts/build.groovy          (contains: ${t})`);
            });

            if (mockFiles.length === 0) {
            mockFiles.push("# No search text provided");
            }
        }

        // render ออกมา
        fileList.innerHTML = mockFiles.map(f => `<div class="file-item">${f}</div>`).join("");
        previewSection.style.display = "block";
    }


    function saveTemplate() {
        const templateName = prompt("Enter template name:");
        if (!templateName) return;

        const template = {
            basePath: document.getElementById("basePath").value,
            selectionMethod: document.querySelector('input[name="selectionMethod"]:checked').value,
            filePatterns: Array.from(document.querySelectorAll("#filePatterns .operation-input")).map(i => i.value).filter(Boolean),
            contentPatterns: Array.from(document.querySelectorAll("#contentPatterns .operation-input")).map(i => i.value).filter(Boolean),
            deletePatterns: Array.from(document.querySelectorAll("#deleteOperations .operation-input")).map(i => i.value).filter(Boolean),
            replaceRules: Array.from(document.querySelectorAll("#replaceOperations .operation-item")).map(item => {
            const [find, replace] = item.querySelectorAll("input");
            return { find: find.value, replace: replace.value };
            }).filter(r => r.find || r.replace)
        };

        // อ่าน templates เก่า
        let templates = JSON.parse(localStorage.getItem("templates") || "{}");
        templates[templateName] = template;

        // เก็บใหม่ลง localStorage
        localStorage.setItem("templates", JSON.stringify(templates));
        showToast(`Template "${templateName}" saved!`);
        renderTemplates();
        }

        function renderTemplates() {
        const container = document.getElementById("templatesList");
        container.innerHTML = "";
        const templates = JSON.parse(localStorage.getItem("templates") || "{}");

        Object.keys(templates).forEach(name => {
            const div = document.createElement("div");
            div.className = "template-item";
            div.innerHTML = `
            <div class="template-info">
                <h4>${name}</h4>
            </div>
            <div class="template-actions">
                <button class="btn btn-secondary" onclick="loadTemplate('${name}')">Load</button>
                <button class="btn btn-remove" onclick="deleteTemplate('${name}')">Delete</button>
            </div>
            `;
            container.appendChild(div);
        });
        }

        function loadTemplate(name) {
        const templates = JSON.parse(localStorage.getItem("templates") || "{}");
        const t = templates[name];
        if (!t) return;

        document.getElementById("basePath").value = t.basePath || ".";
        document.querySelector(`input[name="selectionMethod"][value="${t.selectionMethod}"]`).checked = true;
        handleSelectionMethodChange();

        // โหลด file patterns
        const fileContainer = document.getElementById("filePatterns");
        fileContainer.innerHTML = "";
        t.filePatterns.forEach(p => {
            const div = document.createElement("div");
            div.className = "operation-item";
            div.innerHTML = `<input type="text" class="operation-input" value="${p}" oninput="generateCommand()">
                            <button type="button" class="btn btn-remove" onclick="removeFilePattern(this)">x</button>`;
            fileContainer.appendChild(div);
        });

        // โหลด content patterns
        const contentContainer = document.getElementById("contentPatterns");
        contentContainer.innerHTML = "";
        t.contentPatterns.forEach(c => {
            const div = document.createElement("div");
            div.className = "operation-item";
            div.innerHTML = `<input type="text" class="operation-input" value="${c}" oninput="generateCommand()">
                            <button type="button" class="btn btn-remove" onclick="removeContentPattern(this)">x</button>`;
            contentContainer.appendChild(div);
        });

        // โหลด delete patterns
        const deleteContainer = document.getElementById("deleteOperations");
        deleteContainer.innerHTML = "";
        t.deletePatterns.forEach(d => {
            const div = document.createElement("div");
            div.className = "operation-item";
            div.innerHTML = `<input type="text" class="operation-input" value="${d}" oninput="generateCommand()">
                            <button type="button" class="btn btn-remove" onclick="removeOperation(this)">x</button>`;
            deleteContainer.appendChild(div);
        });

        // โหลด replace rules
        const replaceContainer = document.getElementById("replaceOperations");
        replaceContainer.innerHTML = "";
        t.replaceRules.forEach(r => {
            const div = document.createElement("div");
            div.className = "operation-item";
            div.innerHTML = `<input type="text" class="operation-input" value="${r.find}" oninput="generateCommand()">
                            →
                            <input type="text" class="operation-input" value="${r.replace}" oninput="generateCommand()">
                            <button type="button" class="btn btn-remove" onclick="removeOperation(this)">x</button>`;
            replaceContainer.appendChild(div);
        });

        generateCommand();
        showToast(`Template "${name}" loaded`);
        }

        function deleteTemplate(name) {
        let templates = JSON.parse(localStorage.getItem("templates") || "{}");
        delete templates[name];
        localStorage.setItem("templates", JSON.stringify(templates));
        renderTemplates();
        showToast(`Template "${name}" deleted`);
        }

        // เรียกครั้งแรกเพื่อแสดง templates
        window.onload = () => {
        renderTemplates();
        generateCommand();
        };

    
    function exportCommand() { 
        const cmd = document.getElementById("commandOutput").textContent;
        const blob = new Blob([cmd], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "command.sh";
        a.click();
        URL.revokeObjectURL(url);
        showToast("Exported script!");
    }

    function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

document.addEventListener('input', generateCommand);
window.onload = generateCommand;