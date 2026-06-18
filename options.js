const nameInput = document.getElementById("btn-name");
const urlInput = document.getElementById("btn-url");
const newTabInput = document.getElementById("btn-newtab");
const placementInput = document.getElementById("btn-placement");
const editIdInput = document.getElementById("edit-id");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("button-list");

function loadButtons(cb) {
  chrome.storage.local.get({ customButtons: [] }, (data) => cb(data.customButtons));
}

function saveButtons(buttons, cb) {
  chrome.storage.local.set({ customButtons: buttons }, cb);
}

function showStatus(msg, ok) {
  statusEl.textContent = msg;
  statusEl.className = "status " + (ok ? "status-ok" : "status-err");
  setTimeout(() => { statusEl.textContent = ""; }, 2000);
}

function placementLabel(p) {
  if (p === "breadcrumbs") return "Breadcrumbs (right)";
  if (p === "breadcrumbs-center") return "Breadcrumbs (center)";
  return "Button Group";
}

function renderList(buttons) {
  listEl.innerHTML = "";
  if (!buttons.length) {
    listEl.innerHTML = '<li class="empty-state">No buttons configured yet.</li>';
    return;
  }
  buttons.forEach((b) => {
    const li = document.createElement("li");
    const target = b.newTab ? "new tab" : "same tab";
    li.innerHTML =
      '<div class="button-info">' +
        '<span class="button-name">' + escapeHtml(b.name) + '</span>' +
        '<span class="button-meta">' + escapeHtml(b.url) + ' &middot; ' + target + ' &middot; ' + placementLabel(b.placement) + '</span>' +
      '</div>' +
      '<div class="button-actions">' +
        '<button class="btn btn-move" data-id="' + b.id + '" data-dir="up" title="Move up">▲</button>' +
        '<button class="btn btn-move" data-id="' + b.id + '" data-dir="down" title="Move down">▼</button>' +
        '<button class="btn btn-edit" data-id="' + b.id + '">Edit</button>' +
        '<button class="btn btn-danger btn-delete" data-id="' + b.id + '">Delete</button>' +
      '</div>';
    listEl.appendChild(li);
  });
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function resetForm() {
  editIdInput.value = "";
  nameInput.value = "";
  urlInput.value = "";
  newTabInput.checked = true;
  placementInput.value = "breadcrumbs";
  formTitle.textContent = "Add Button";
  saveBtn.textContent = "Add";
  cancelBtn.style.display = "none";
}

function refresh() {
  loadButtons(renderList);
}

saveBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const url = urlInput.value.trim();
  if (!name || !url) {
    showStatus("Name and URL are required.", false);
    return;
  }

  loadButtons((buttons) => {
    const editId = editIdInput.value;
    if (editId) {
      const idx = buttons.findIndex((b) => b.id === editId);
      if (idx !== -1) {
        buttons[idx] = { id: editId, name, url, newTab: newTabInput.checked, placement: placementInput.value };
      }
    } else {
      buttons.push({
        id: Date.now().toString(36),
        name,
        url,
        newTab: newTabInput.checked,
        placement: placementInput.value,
      });
    }
    saveButtons(buttons, () => {
      showStatus(editId ? "Button updated." : "Button added.", true);
      resetForm();
      refresh();
    });
  });
});

cancelBtn.addEventListener("click", resetForm);

listEl.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("btn-move")) {
    const dir = e.target.dataset.dir;
    loadButtons((buttons) => {
      const idx = buttons.findIndex((b) => b.id === id);
      if (idx === -1) return;
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= buttons.length) return;
      [buttons[idx], buttons[swap]] = [buttons[swap], buttons[idx]];
      saveButtons(buttons, refresh);
    });
    return;
  }

  if (e.target.classList.contains("btn-delete")) {
    loadButtons((buttons) => {
      saveButtons(buttons.filter((b) => b.id !== id), () => {
        showStatus("Button deleted.", true);
        if (editIdInput.value === id) resetForm();
        refresh();
      });
    });
  }

  if (e.target.classList.contains("btn-edit")) {
    loadButtons((buttons) => {
      const b = buttons.find((x) => x.id === id);
      if (!b) return;
      editIdInput.value = b.id;
      nameInput.value = b.name;
      urlInput.value = b.url;
      newTabInput.checked = b.newTab;
      placementInput.value = b.placement;
      formTitle.textContent = "Edit Button";
      saveBtn.textContent = "Save";
      cancelBtn.style.display = "";
      nameInput.focus();
    });
  }
});

refresh();