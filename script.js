// Global variables
let availableTemplates = {};
let selectedTemplate = null;

// Modal Management Functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Step 1: Mode Selection
function showModeSelection() {
  showModal('modeSelectionModal');
}

function closeModeSelection() {
  hideModal('modeSelectionModal');
}

// Step 2: Template Selection (for Add mode)
async function showTemplateSelection() {
  hideModal('modeSelectionModal');
  showModal('templateSelectionModal');
  await loadAvailableTemplates();
}

function backToModeSelection() {
  hideModal('templateSelectionModal');
  showModal('modeSelectionModal');
  selectedTemplate = null;
}



// Template Loading Functions
document.addEventListener("DOMContentLoaded", () => {
  loadTemplates();
});

async function loadTemplates() {
  const grid = document.getElementById("templatesGrid");
  grid.innerHTML = '<div class="loading">Loading templates...</div>';

  try {
    const res = await fetch("templates/.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const files = await res.json();

    grid.innerHTML = ""; // clear loading

    // โหลดทีละไฟล์
    for (const file of files) {
      try {
        const tRes = await fetch('templates/${file}');
        if (!tRes.ok) throw new Error('HTTP ${tRes.status}');
        const template = await tRes.json();

        // ใช้ key แรกเป็นชื่อ template
        const name = Object.keys(template)[0];
        const card = document.createElement("div");
        card.className = "template-card";
        card.innerHTML = `
          <div class="template-name">${name}</div>
          <div class="template-description">Loaded from ${file}</div>
        `;

        // เพิ่ม event เลือก template
        card.addEventListener("click", () => {
          document
            .querySelectorAll(".template-card")
            .forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");

          // enable ปุ่ม Use Template
          document.getElementById("proceedBtn").disabled = false;

          // เก็บ template ที่เลือกไว้ใน global
          window.selectedTemplate = { name, file, data: template[name] };
        });

        grid.appendChild(card);
      } catch (err) {
        console.error(`❌ โหลด ${file} ไม่ได้`, err);
      }
    }
  } catch (err) {
    console.error("❌ โหลด templates/index.json ไม่ได้", err);
    grid.innerHTML = '<div class="loading">Error loading templates.</div>';
  }
}

// ใช้ template ที่เลือก
function proceedWithTemplate() {
  if (!window.selectedTemplate) return;

  const { name, data } = window.selectedTemplate;

  // ใส่ข้อมูลลง modal dynamic form
  document.getElementById("formTitle").innerText = `📝 Configure: ${name}`;
  const form = document.getElementById("dynamicForm");
  const info = document.getElementById("templateInfo");
  form.innerHTML = "";
  info.innerHTML = `<h4>${name}</h4><p>Fill the required fields below</p>`;

  for (const [field, placeholder] of Object.entries(data)) {
    const fieldDiv = document.createElement("div");
    fieldDiv.className = "form-field";
    fieldDiv.innerHTML = `
      <label>${field}</label>
      <input type="text" name="${field}" placeholder="${placeholder}">
    `;
    form.appendChild(fieldDiv);
  }

  // ซ่อน modal เลือก template → โชว์ modal ฟอร์ม
  document.getElementById("templateSelectionModal").classList.remove("show");
  document.getElementById("dynamicFormModal").classList.add("show");
}

function renderTemplatesGrid() {
  const templatesGrid = document.getElementById('templatesGrid');
  templatesGrid.innerHTML = '';

  if (Object.keys(availableTemplates).length === 0) {
    templatesGrid.innerHTML = '<div class="loading">No templates available</div>';
    return;
  }

  Object.keys(availableTemplates).forEach(templateKey => {
    const template = availableTemplates[templateKey];
    
    const templateCard = document.createElement('div');
    templateCard.className = 'template-card';
    templateCard.dataset.template = templateKey;
    
    const fieldsCount = Object.keys(template.fields).length;
    const fieldsPreview = Object.keys(template.fields).slice(0, 3).join(', ');
    const moreFields = fieldsCount > 3 ? ` and ${fieldsCount - 3} more...` : '';
    
    templateCard.innerHTML = `
      <div class="template-name">${template.name}</div>
      <div class="template-description">${template.description}</div>
      <div class="template-fields">
        <strong>Fields:</strong> ${fieldsPreview}${moreFields}
      </div>
    `;
    
    templateCard.addEventListener('click', () => {
      document.querySelectorAll('.template-card').forEach(card => {
        card.classList.remove('selected');
      });
      templateCard.classList.add('selected');
      selectedTemplate = templateKey;
      document.getElementById('proceedBtn').disabled = false;
    });
    
    templatesGrid.appendChild(templateCard);
  });
}

function proceedWithTemplate() {
  if (!selectedTemplate) {
    showToast('Please select a template first');
    return;
  }
  
  hideModal('templateSelectionModal');
  showDynamicForm();
}

function backToTemplateSelection() {
  hideModal('dynamicFormModal');
  showModal('templateSelectionModal');
}

function showDynamicForm() {
  const template = availableTemplates[selectedTemplate];
  const formTitle = document.getElementById('formTitle');
  const templateInfo = document.getElementById('templateInfo');
  const dynamicForm = document.getElementById('dynamicForm');
  
  formTitle.textContent = `Configure: ${template.name}`;
  templateInfo.innerHTML = `
    <h4>${template.name}</h4>
    <p>${template.description}</p>
  `;
  
  // Generate form fields
  dynamicForm.innerHTML = '';
  
  Object.keys(template.fields).forEach(fieldKey => {
    const fieldDescription = template.fields[fieldKey];
    const isRequired = !fieldDescription.toLowerCase().includes('optional');
    
    const formField = document.createElement('div');
    formField.className = `form-field ${isRequired ? 'required' : ''}`;
    
    const fieldType = getFieldType(fieldKey, fieldDescription);
    
    formField.innerHTML = `
      <label for="${fieldKey}">${formatFieldLabel(fieldKey)}</label>
      ${generateInputField(fieldKey, fieldDescription, fieldType)}
      <div class="help-text">${fieldDescription}</div>
    `;
    
    dynamicForm.appendChild(formField);
  });
  
  showModal('dynamicFormModal');
}

function formatFieldLabel(fieldKey) {
  return fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getFieldType(fieldKey, description) {
  const key = fieldKey.toLowerCase();
  const desc = description.toLowerCase();
  
  if (key.includes('email') || desc.includes('email')) return 'email';
  if (key.includes('password') || desc.includes('password')) return 'password';
  if (key.includes('port') || key.includes('timeout') || desc.includes('number')) return 'number';
  if (key.includes('enable') || key.includes('disable') || desc.includes('true/false')) return 'boolean';
  if (desc.includes('select') || desc.includes('choose')) return 'select';
  if (desc.length > 50) return 'textarea';
  
  return 'text';
}

function generateInputField(fieldKey, description, fieldType) {
  const defaultValue = getDefaultValue(fieldKey, description);
  
  switch (fieldType) {
    case 'email':
      return `<input type="email" id="${fieldKey}" name="${fieldKey}" value="${defaultValue}" placeholder="Enter email address">`;
    
    case 'password':
      return `<input type="password" id="${fieldKey}" name="${fieldKey}" placeholder="Enter password">`;
    
    case 'number':
      return `<input type="number" id="${fieldKey}" name="${fieldKey}" value="${defaultValue}" placeholder="Enter number">`;
    
    case 'boolean':
      return `
        <select id="${fieldKey}" name="${fieldKey}">
          <option value="true" ${defaultValue === 'true' ? 'selected' : ''}>True</option>
          <option value="false" ${defaultValue === 'false' ? 'selected' : ''}>False</option>
        </select>
      `;
    
    case 'select':
      const options = extractOptionsFromDescription(description);
      return `
        <select id="${fieldKey}" name="${fieldKey}">
          ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
        </select>
      `;
    
    case 'textarea':
      return `<textarea id="${fieldKey}" name="${fieldKey}" placeholder="${description}">${defaultValue}</textarea>`;
    
    default:
      return `<input type="text" id="${fieldKey}" name="${fieldKey}" value="${defaultValue}" placeholder="${description}">`;
  }
}

function getDefaultValue(fieldKey, description) {
  const key = fieldKey.toLowerCase();
  
  if (key.includes('environment') || key.includes('env')) return 'dev';
  if (key.includes('namespace')) return 'default';
  if (key.includes('enable')) return 'true';
  if (key.includes('port')) return '8080';
  if (key.includes('path')) return './';
  
  return '';
}

function extractOptionsFromDescription(description) {
  const match = description.match(/\(([^)]+)\)/);
  if (match) {
    return match[1].split(',').map(option => option.trim());
  }
  return ['option1', 'option2'];
}

function applyTemplate() {
  const template = availableTemplates[selectedTemplate];
  const form = document.getElementById('dynamicForm');
  const formData = new FormData(form);
  
  // Clear existing form
  clearAllOperations();
  
  // Apply template data to form fields
  const templateConfig = {
    basePath: formData.get('base_path') || '.',
    selectionMethod: 'pattern',
    filePatterns: [],
    contentPatterns: [],
    deletePatterns: [],
    replaceRules: []
  };
  
  // Build patterns and rules based on template
  const imageNamePattern = formData.get('image_name');
  const appName = formData.get('app_name');
  const environment = formData.get('myenvironment') || formData.get('environment');
  
  if (imageNamePattern) {
    templateConfig.filePatterns.push(`*${imageNamePattern}*.groovy`);
    templateConfig.filePatterns.push(`*${imageNamePattern}*.yaml`);
  }
  
  if (appName) {
    templateConfig.filePatterns.push(`*${appName}*.groovy`);
    templateConfig.filePatterns.push(`*${appName}*.yaml`);
  }
  
  if (template.name.includes('helm')) {
    templateConfig.filePatterns.push('*helm*.yaml');
    templateConfig.filePatterns.push('*values*.yaml');
    templateConfig.deletePatterns.push('# TODO: Remove this');
    templateConfig.deletePatterns.push('deprecated:');
  }
  
  if (template.name.includes('nodejs')) {
    templateConfig.filePatterns.push('package.json');
    templateConfig.filePatterns.push('*.js');
    templateConfig.deletePatterns.push('console.log');
    templateConfig.deletePatterns.push('// TODO');
  }
  
  if (template.name.includes('python')) {
    templateConfig.filePatterns.push('*.py');
    templateConfig.filePatterns.push('requirements.txt');
    templateConfig.deletePatterns.push('print(');
    templateConfig.deletePatterns.push('# TODO');
  }
  
  if (environment) {
    templateConfig.replaceRules.push({
      find: 'dev',
      replace: environment
    });
  }
  
  // Apply configuration to the form
  applyConfigurationToForm(templateConfig);
  
  hideModal('dynamicFormModal');
  showToast(`Template "${template.name}" applied successfully!`);
  generateCommand();
}

function clearAllOperations() {
  const filePatterns = document.getElementById('filePatterns');
  filePatterns.innerHTML = `
    <div class="operation-item">
      <input type="text" class="operation-input" placeholder="File pattern (e.g., *.groovy)" value="" oninput="generateCommand()">
      <button type="button" class="btn btn-remove" onclick="removeFilePattern(this)">❌</button>
    </div>
  `;
  
  const contentPatterns = document.getElementById('contentPatterns');
  contentPatterns.innerHTML = `
    <div class="operation-item">
      <input type="text" class="operation-input" placeholder="Text content to search for" value="" oninput="generateCommand()">
      <button type="button" class="btn btn-remove" onclick="removeContentPattern(this)">❌</button>
    </div>
  `;
  
  const deleteOperations = document.getElementById('deleteOperations');
  deleteOperations.innerHTML = `
    <div class="operation-item">
      <input type="text" class="operation-input" placeholder="Pattern to delete (e.g., git_params:)" value="">
      <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>
    </div>
  `;
  
  const replaceOperations = document.getElementById('replaceOperations');
  replaceOperations.innerHTML = `
    <div class="operation-item">
      <input type="text" class="operation-input" placeholder="Find text" value="">
      <span style="color: #ff6b35; font-weight: bold;">→</span>
      <input type="text" class="operation-input" placeholder="Replace with" value="">
      <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>
    </div>
  `;
}

function applyConfigurationToForm(config) {
  document.getElementById('basePath').value = config.basePath;
  
  document.querySelector(`input[name="selectionMethod"][value="${config.selectionMethod}"]`).checked = true;
  handleSelectionMethodChange();
  
  const fileContainer = document.getElementById('filePatterns');
  fileContainer.innerHTML = '';
  config.filePatterns.forEach(pattern => {
    addPatternToContainer(fileContainer, pattern, 'removeFilePattern');
  });
  if (config.filePatterns.length === 0) {
    addPatternToContainer(fileContainer, '', 'removeFilePattern');
  }
  
  const contentContainer = document.getElementById('contentPatterns');
  contentContainer.innerHTML = '';
  config.contentPatterns.forEach(pattern => {
    addPatternToContainer(contentContainer, pattern, 'removeContentPattern');
  });
  if (config.contentPatterns.length === 0) {
    addPatternToContainer(contentContainer, '', 'removeContentPattern');
  }
  
  const deleteContainer = document.getElementById('deleteOperations');
  deleteContainer.innerHTML = '';
  config.deletePatterns.forEach(pattern => {
    addPatternToContainer(deleteContainer, pattern, 'removeOperation');
  });
  if (config.deletePatterns.length === 0) {
    addPatternToContainer(deleteContainer, '', 'removeOperation');
  }
  
  const replaceContainer = document.getElementById('replaceOperations');
  replaceContainer.innerHTML = '';
  config.replaceRules.forEach(rule => {
    const div = document.createElement('div');
    div.className = 'operation-item';
    div.innerHTML = `
      <input type="text" class="operation-input" placeholder="Find text" value="${rule.find}" oninput="generateCommand()">
      <span style="color: #ff6b35; font-weight: bold;">→</span>
      <input type="text" class="operation-input" placeholder="Replace with" value="${rule.replace}" oninput="generateCommand()">
      <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>
    `;
    replaceContainer.appendChild(div);
  });
  if (config.replaceRules.length === 0) {
    addReplaceOperation();
  }
}

function addPatternToContainer(container, value, removeFunction) {
  const div = document.createElement('div');
  div.className = 'operation-item';
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="Pattern" value="${value}" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="${removeFunction}(this)">❌</button>
  `;
  container.appendChild(div);
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    const modalId = e.target.id;
    hideModal(modalId);
  }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModal = document.querySelector('.modal.show');
    if (openModal) {
      hideModal(openModal.id);
    }
  }
});


// Original functions (for gen command shell)
function generateCommand() {
  const basePath = document.getElementById('basePath').value || '.';
  const selectionMethod = document.querySelector('input[name="selectionMethod"]:checked').value;
  const includeSubdirs = document.getElementById('includeSubdirs').checked;
  const filesOnly = document.getElementById('filesOnly').checked;

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

  const deletes = Array.from(document.querySelectorAll("#deleteOperations .operation-input"))
    .map(i => i.value).filter(Boolean);
  const replaces = [];
  document.querySelectorAll("#replaceOperations .operation-item").forEach(item => {
    const [f, r] = item.querySelectorAll("input");
    if (f && r && (f.value || r.value)) replaces.push({ find: f.value, replace: r.value });
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
  div.innerHTML = `
    <input type="text" class="operation-input" placeholder="Pattern to delete" oninput="generateCommand()">
    <button type="button" class="btn btn-remove" onclick="removeDeleteOperation(this)">❌</button>
  `;
  container.appendChild(div);
  generateCommand();
}

function removeDeleteOperation(button) {
  const operationItem = button.parentElement;
  operationItem.remove();
  generateCommand();
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
    const patterns = Array.from(document.querySelectorAll("#filePatterns .operation-input"))
    .map(i => i.value).filter(Boolean);

    patterns.forEach(p => {
      mockFiles.push(`./example/${p.replace("*", "demo")}`);
    });
    if (mockFiles.length === 0) {
    mockFiles.push("# No file patterns provided");
    }

  } else {
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

  let templates = JSON.parse(localStorage.getItem("templates") || "{}");
  templates[templateName] = template;

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

  const fileContainer = document.getElementById("filePatterns");
  fileContainer.innerHTML = "";
  t.filePatterns.forEach(p => {
    const div = document.createElement("div");
    div.className = "operation-item";
    div.innerHTML = `<input type="text" class="operation-input" value="${p}" oninput="generateCommand()">
                    <button type="button" class="btn btn-remove" onclick="removeFilePattern(this)">❌</button>`;
    fileContainer.appendChild(div);
  });

  const contentContainer = document.getElementById("contentPatterns");
  contentContainer.innerHTML = "";
  t.contentPatterns.forEach(c => {
    const div = document.createElement("div");
    div.className = "operation-item";
    div.innerHTML = `<input type="text" class="operation-input" value="${c}" oninput="generateCommand()">
                    <button type="button" class="btn btn-remove" onclick="removeContentPattern(this)">❌</button>`;
    contentContainer.appendChild(div);
  });

  const deleteContainer = document.getElementById("deleteOperations");
  deleteContainer.innerHTML = "";
  t.deletePatterns.forEach(d => {
    const div = document.createElement("div");
    div.className = "operation-item";
    div.innerHTML = `<input type="text" class="operation-input" value="${d}" oninput="generateCommand()">
                    <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>`;
    deleteContainer.appendChild(div);
  });

  const replaceContainer = document.getElementById("replaceOperations");
  replaceContainer.innerHTML = "";
  t.replaceRules.forEach(r => {
    const div = document.createElement("div");
    div.className = "operation-item";
    div.innerHTML = `<input type="text" class="operation-input" value="${r.find}" oninput="generateCommand()">
                    <span style="color:#ff6b35;font-weight:bold;">→</span>
                    <input type="text" class="operation-input" value="${r.replace}" oninput="generateCommand()">
                    <button type="button" class="btn btn-remove" onclick="removeOperation(this)">❌</button>`;
    replaceContainer.appendChild(div);
  });

  generateCommand();
  showToast(`Template "${name}" loaded`);
}

function deleteTemplate(name) {
  if (confirm(`Are you sure you want to delete template "${name}"?`)) {
    let templates = JSON.parse(localStorage.getItem("templates") || "{}");
    delete templates[name];
    localStorage.setItem("templates", JSON.stringify(templates));
    renderTemplates();
    showToast(`Template "${name}" deleted`);
  }
}

function exportCommand() { 
  const cmd = document.getElementById("commandOutput").textContent;
  if (!cmd || cmd.trim() === '') {
    showToast("No command to export");
    return;
  }
  
  const blob = new Blob([`#!/bin/bash\n# Generated by Shell Command Builder\n\n${cmd}\n`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "generated-command.sh";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Command exported as shell script!");
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing...');
  generateCommand();
  renderTemplates();
  
  // Add event listeners for inputs
  document.addEventListener('input', function(e) {
    if (e.target.classList.contains('operation-input') || 
        e.target.id === 'basePath') {
      generateCommand();
    }
  });
  
  // Add event listeners for checkboxes and radio buttons
  document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox' || e.target.type === 'radio') {
      generateCommand();
    }
  });
});

// Fallback for older browsers
window.onload = function() {
  if (!document.readyState || document.readyState === 'complete') {
    generateCommand();
    renderTemplates();
  }
};