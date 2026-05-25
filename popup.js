(function popupController() {
  const state = {
    customQueries: [],
    allQueries: [],
    searchText: "",
    category: "All",
    editingId: null,
    statusTimeoutId: null
  };

  const refs = {};
  const INSPECTOR_URL_TEMPLATE = "chrome-extension://aodjmnfhjibkcdimpodiifdjnnncaafh/data-export.html?host={{host}}";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheDom();
    bindEvents();
    await refreshQueries();
  }

  function cacheDom() {
    refs.searchInput = document.getElementById("searchInput");
    refs.categoryFilter = document.getElementById("categoryFilter");
    refs.resultCount = document.getElementById("resultCount");
    refs.statusMessage = document.getElementById("statusMessage");
    refs.queryList = document.getElementById("queryList");
    refs.addQueryButton = document.getElementById("addQueryButton");
    refs.exportButton = document.getElementById("exportButton");
    refs.importButton = document.getElementById("importButton");
    refs.importInput = document.getElementById("importInput");
    refs.queryModal = document.getElementById("queryModal");
    refs.queryModalTitle = document.getElementById("queryModalTitle");
    refs.queryForm = document.getElementById("queryForm");
    refs.queryTitle = document.getElementById("queryTitle");
    refs.queryCategory = document.getElementById("queryCategory");
    refs.queryDescription = document.getElementById("queryDescription");
    refs.querySoql = document.getElementById("querySoql");
    refs.closeQueryModalButton = document.getElementById("closeQueryModalButton");
    refs.cancelQueryModalButton = document.getElementById("cancelQueryModalButton");
    refs.variableModal = document.getElementById("variableModal");
    refs.variableForm = document.getElementById("variableForm");
    refs.variableFields = document.getElementById("variableFields");
    refs.closeVariableModalButton = document.getElementById("closeVariableModalButton");
    refs.cancelVariableModalButton = document.getElementById("cancelVariableModalButton");
  }

  function bindEvents() {
    refs.searchInput.addEventListener("input", (event) => {
      state.searchText = event.target.value.trim().toLowerCase();
      render();
    });

    refs.categoryFilter.addEventListener("change", (event) => {
      state.category = event.target.value;
      render();
    });

    refs.addQueryButton.addEventListener("click", () => openQueryModal());
    refs.exportButton.addEventListener("click", handleExport);
    refs.importButton.addEventListener("click", () => refs.importInput.click());
    refs.importInput.addEventListener("change", handleImport);
    refs.queryForm.addEventListener("submit", handleQuerySave);
    refs.closeQueryModalButton.addEventListener("click", closeQueryModal);
    refs.cancelQueryModalButton.addEventListener("click", closeQueryModal);
    refs.closeVariableModalButton.addEventListener("click", closeVariableModal);
    refs.cancelVariableModalButton.addEventListener("click", closeVariableModal);

    refs.queryList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");

      if (!button) {
        return;
      }

      const { action, queryId } = button.dataset;

      if (action === "copy") {
        await handleCopy(queryId);
      }

      if (action === "open") {
        await handleOpenInspector(queryId);
      }

      if (action === "edit") {
        openQueryModal(queryId);
      }

      if (action === "delete") {
        await handleDelete(queryId);
      }
    });
  }

  async function refreshQueries() {
    state.customQueries = await window.QueryVaultStorage.getCustomQueries();
    state.allQueries = [...window.DEFAULT_QUERY_LIBRARY, ...state.customQueries].sort((left, right) => {
      const categorySort = left.category.localeCompare(right.category);
      return categorySort || left.title.localeCompare(right.title);
    });
    renderCategoryOptions();
    render();
  }

  function renderCategoryOptions() {
    const categories = getCategories();
    refs.categoryFilter.innerHTML = ["All", ...categories]
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join("");
    if (!["All", ...categories].includes(state.category)) {
      state.category = "All";
    }
    refs.categoryFilter.value = state.category;

    refs.queryCategory.innerHTML = categories
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join("");
  }

  function getCategories() {
    return [...new Set(state.allQueries.map((query) => query.category))].sort((left, right) => left.localeCompare(right));
  }

  function getVisibleQueries() {
    return state.allQueries.filter((query) => {
      const matchesCategory = state.category === "All" || query.category === state.category;

      if (!matchesCategory) {
        return false;
      }

      if (!state.searchText) {
        return true;
      }

      const haystack = [query.title, query.category, query.description, query.query].join(" ").toLowerCase();
      return haystack.includes(state.searchText);
    });
  }

  function render() {
    const visibleQueries = getVisibleQueries();
    refs.resultCount.textContent = `${visibleQueries.length} query${visibleQueries.length === 1 ? "" : "ies"}`;

    if (!visibleQueries.length) {
      refs.queryList.innerHTML = `
        <div class="card empty-state">
          <strong>No queries match the current filters.</strong>
          <p>Adjust the search, switch categories, or add a custom query.</p>
        </div>
      `;
      return;
    }

    refs.queryList.innerHTML = visibleQueries.map(renderQueryCard).join("");
  }

  function renderQueryCard(query) {
    const preview = query.query.length > 180 ? `${query.query.slice(0, 180)}...` : query.query;

    return `
      <article class="query-card">
        <div class="modal-header">
          <h3>${escapeHtml(query.title)}</h3>
          <div class="query-meta">
            <span class="pill">${escapeHtml(query.category)}</span>
            ${query.isDefault ? '<span class="pill pill-muted">Default</span>' : '<span class="pill pill-muted">Custom</span>'}
          </div>
        </div>
        <p>${escapeHtml(query.description || "No description provided.")}</p>
        <pre class="query-preview">${escapeHtml(preview)}</pre>
        <div class="query-actions">
          <button class="button button-primary" type="button" data-action="copy" data-query-id="${escapeHtml(query.id)}">Copy Query</button>
          <button class="button button-secondary" type="button" data-action="open" data-query-id="${escapeHtml(query.id)}">Open Inspector</button>
          <button class="button button-secondary" type="button" data-action="edit" data-query-id="${escapeHtml(query.id)}" ${query.isDefault ? "disabled" : ""}>Edit</button>
          <button class="button button-secondary" type="button" data-action="delete" data-query-id="${escapeHtml(query.id)}" ${query.isDefault ? "disabled" : ""}>Delete</button>
        </div>
      </article>
    `;
  }

  function openQueryModal(queryId) {
    const query = queryId ? state.customQueries.find((item) => item.id === queryId) : null;
    state.editingId = query ? query.id : null;
    refs.queryModalTitle.textContent = query ? "Edit Query" : "Add Query";
    refs.queryTitle.value = query ? query.title : "";
    const availableCategories = getCategories();
    const fallbackCategory = availableCategories.includes("CPQ") ? "CPQ" : availableCategories[0] || "CPQ";
    refs.queryCategory.value = query && availableCategories.includes(query.category) ? query.category : fallbackCategory;
    refs.queryDescription.value = query ? query.description : "";
    refs.querySoql.value = query ? query.query : "";
    refs.queryModal.showModal();
    refs.queryTitle.focus();
  }

  function closeQueryModal() {
    refs.queryForm.reset();
    refs.queryModal.close();
    state.editingId = null;
  }

  async function handleQuerySave(event) {
    event.preventDefault();

    const input = {
      title: refs.queryTitle.value,
      category: refs.queryCategory.value,
      description: refs.queryDescription.value,
      query: refs.querySoql.value
    };

    try {
      if (state.editingId) {
        await window.QueryVaultStorage.updateCustomQuery(state.editingId, input);
        showStatus("Custom query updated.", "success");
      } else {
        await window.QueryVaultStorage.createCustomQuery(input);
        showStatus("Custom query added.", "success");
      }

      closeQueryModal();
      await refreshQueries();
    } catch (error) {
      showStatus(error.message || "Unable to save query.", "error");
    }
  }

  async function handleDelete(queryId) {
    const query = state.customQueries.find((item) => item.id === queryId);

    if (!query) {
      showStatus("Only custom queries can be deleted.", "warning");
      return;
    }

    const confirmed = window.confirm(`Delete custom query "${query.title}"?`);

    if (!confirmed) {
      return;
    }

    await window.QueryVaultStorage.deleteCustomQuery(queryId);
    showStatus("Custom query deleted.", "success");
    await refreshQueries();
  }

  async function handleCopy(queryId) {
    const query = findQuery(queryId);

    if (!query) {
      showStatus("Query not found.", "error");
      return;
    }

    const finalQuery = await resolveQueryText(query.query);

    if (finalQuery === null) {
      showStatus("Copy cancelled.", "warning");
      return;
    }

    try {
      await copyToClipboard(finalQuery);
      showStatus("Query copied.", "success");
    } catch (error) {
      showStatus("Clipboard access failed.", "error");
    }
  }

  async function handleOpenInspector(queryId) {
    const query = findQuery(queryId);

    if (!query) {
      showStatus("Query not found.", "error");
      return;
    }

    const finalQuery = await resolveQueryText(query.query);

    if (finalQuery === null) {
      showStatus("Inspector launch cancelled.", "warning");
      return;
    }

    try {
      await copyToClipboard(finalQuery);
    } catch (error) {
      showStatus("Clipboard access failed.", "error");
      return;
    }

    const launchResult = await tryLaunchInspector();
    showStatus(launchResult.message, launchResult.kind);
  }

  async function handleExport() {
    try {
      const exportPayload = await window.QueryVaultStorage.exportCustomQueries();
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `salesforce-query-vault-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(objectUrl);
      showStatus("Library setup exported with defaults and custom queries.", "success");
    } catch (error) {
      showStatus("Unable to export library setup.", "error");
    }
  }

  async function handleImport(event) {
    const [file] = event.target.files || [];

    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);
      await window.QueryVaultStorage.importCustomQueries(parsed);
      await refreshQueries();
      showStatus("Custom queries imported.", "success");
    } catch (error) {
      showStatus(error.message || "Import failed. Supply a valid JSON array.", "error");
    } finally {
      refs.importInput.value = "";
    }
  }

  function findQuery(queryId) {
    return state.allQueries.find((query) => query.id === queryId) || null;
  }

  async function resolveQueryText(queryText) {
    const placeholders = extractPlaceholders(queryText);

    if (!placeholders.length) {
      return queryText;
    }

    const values = await promptForPlaceholderValues(placeholders);

    if (!values) {
      return null;
    }

    return placeholders.reduce((resolvedQuery, key) => {
      const tokenPattern = new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "g");
      return resolvedQuery.replace(tokenPattern, values[key]);
    }, queryText);
  }

  function extractPlaceholders(queryText) {
    const tokens = queryText.match(/{{\s*[a-zA-Z0-9_]+\s*}}/g) || [];
    return [...new Set(tokens.map((token) => token.replace(/[{}\s]/g, "")))];
  }

  function promptForPlaceholderValues(placeholders) {
    return new Promise((resolve) => {
      refs.variableFields.innerHTML = placeholders.map((placeholder) => `
        <label class="field">
          <span>${escapeHtml(formatPlaceholderLabel(placeholder))}</span>
          <input type="text" name="${escapeHtml(placeholder)}" required>
        </label>
      `).join("");

      const cleanUp = (value) => {
        refs.variableForm.removeEventListener("submit", onSubmit);
        refs.variableModal.removeEventListener("close", onClose);
        refs.variableModal.close();
        resolve(value);
      };

      const onSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(refs.variableForm);
        const values = {};

        for (const placeholder of placeholders) {
          const value = String(formData.get(placeholder) || "").trim();

          if (!value) {
            return;
          }

          values[placeholder] = value;
        }

        cleanUp(values);
      };

      const onClose = () => {
        refs.variableForm.removeEventListener("submit", onSubmit);
        refs.variableModal.removeEventListener("close", onClose);
        resolve(null);
      };

      refs.variableForm.addEventListener("submit", onSubmit);
      refs.variableModal.addEventListener("close", onClose, { once: true });
      refs.variableModal.showModal();
      const firstInput = refs.variableFields.querySelector("input");
      if (firstInput) {
        firstInput.focus();
      }
    });
  }

  function closeVariableModal() {
    if (refs.variableModal.open) {
      refs.variableModal.close();
    }
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "readonly");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  async function tryLaunchInspector() {
    const activeTab = await getActiveTab();

    if (!activeTab || !activeTab.url) {
      return {
        message: "Query copied. Open a Salesforce tab, then paste into Salesforce Inspector.",
        kind: "warning"
      };
    }

    let activeUrl;

    try {
      activeUrl = new URL(activeTab.url);
    } catch (error) {
      return {
        message: "Query copied. The current tab URL could not be read reliably.",
        kind: "warning"
      };
    }

    if (!isSalesforceHostname(activeUrl.hostname)) {
      return {
        message: "Query copied. Switch to a Salesforce org tab, then paste into Inspector.",
        kind: "warning"
      };
    }

    if (/Firefox/i.test(navigator.userAgent)) {
      return {
        message: "Query copied. Firefox launch falls back to manual paste because Inspector deep-links are not stable across installs.",
        kind: "warning"
      };
    }

    try {
      const targetUrl = INSPECTOR_URL_TEMPLATE.replace("{{host}}", encodeURIComponent(activeUrl.origin));
      await window.extCompat.createTab({ url: targetUrl });
      return {
        message: "Query copied. Attempted to open Salesforce Inspector for the current org.",
        kind: "success"
      };
    } catch (error) {
      return {
        message: "Query copied. Open Salesforce Inspector manually and paste the query.",
        kind: "warning"
      };
    }
  }

  async function getActiveTab() {
    try {
      const tabs = await window.extCompat.queryTabs({ active: true, currentWindow: true });
      return tabs[0] || null;
    } catch (error) {
      return null;
    }
  }

  function isSalesforceHostname(hostname) {
    return [".salesforce.com", ".force.com", ".lightning.force.com", ".my.salesforce.com"]
      .some((suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix));
  }

  function formatPlaceholderLabel(placeholder) {
    return placeholder.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  }

  function showStatus(message, kind = "info") {
    refs.statusMessage.textContent = message;
    refs.statusMessage.className = "status-message";

    if (kind === "success") {
      refs.statusMessage.classList.add("is-success");
    }

    if (kind === "warning") {
      refs.statusMessage.classList.add("is-warning");
    }

    if (kind === "error") {
      refs.statusMessage.classList.add("is-error");
    }

    window.clearTimeout(state.statusTimeoutId);
    state.statusTimeoutId = window.setTimeout(() => {
      refs.statusMessage.textContent = "";
      refs.statusMessage.className = "status-message";
    }, 3600);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
})();