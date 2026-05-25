# Salesforce Query Vault

Salesforce Query Vault is a cross-browser WebExtension for Chrome and Firefox that opens as a full browser tab, stores reusable SOQL queries, prompts for placeholder values, copies the final query to the clipboard, and attempts a best-effort launch into Salesforce Inspector.

## Features

- Searchable SOQL query library with category filtering.
- Built-in read-only queries for CPQ, Advanced Approvals, Admin, Products, RCA / Revenue Cloud, and Debug.
- Custom query create, edit, delete, import, and export.
- Placeholder prompts for values such as `{{quoteNumber}}`, `{{recordId}}`, `{{userEmail}}`, `{{productCode}}`, and `{{opportunityId}}`.
- Clipboard-first workflow for Salesforce Inspector and Salesforce Inspector Reloaded.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the extension folder that contains `manifest.json`.

## Install in Firefox

1. Open `about:debugging`.
2. Click **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select the extension's `manifest.json` file.

## How to Use

1. Click the extension button in the browser toolbar to open the full-screen Query Vault panel in a browser tab.
2. Search the library or filter by category.
3. Click **Copy Query** to resolve placeholders and copy the final SOQL to your clipboard.
4. Click **Open Inspector** to copy the query and attempt a best-effort Inspector launch for the active Salesforce org.
5. Use **Add Query** to create custom queries that are stored in extension local storage.
6. Use **Export JSON** to back up the full library setup, including the built-in default library and your custom queries.
7. Use **Import JSON** to restore custom queries from either a legacy query array or a full exported setup object.

## Import Format

Imported JSON must be an array. Each item needs at least:

- `title`
- `category`
- `query`

Optional fields:

- `description`
- `id`
- `createdAt`
- `updatedAt`

Example:

```json
[
  {
    "title": "Opportunities by Account",
    "category": "Admin",
    "description": "Find opportunities for an account.",
    "query": "SELECT Id, Name, StageName FROM Opportunity WHERE AccountId = '{{recordId}}'"
  }
]
```

## Known Limitations

- The MVP does not log into Salesforce.
- The MVP does not store Salesforce credentials.
- The MVP does not call Salesforce APIs.
- Auto-launch into Salesforce Inspector can be fragile across browsers and extension variants, so the reliable path is still clipboard-first: the extension copies the final SOQL and you can paste it into Salesforce Inspector or Salesforce Inspector Reloaded manually.