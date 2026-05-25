(function attachStorageApi() {
  const STORAGE_KEY = "customQueries";
  const EXPORT_SCHEMA_VERSION = 1;

  function generateQueryId() {
    return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizeQuery(rawQuery, options = {}) {
    const title = normalizeText(rawQuery.title);
    const category = normalizeText(rawQuery.category) || "Custom";
    const query = normalizeText(rawQuery.query);

    if (!title) {
      throw new Error("Each query needs a title.");
    }

    if (!query) {
      throw new Error("Each query needs a SOQL statement.");
    }

    const now = new Date().toISOString();

    return {
      id: normalizeText(rawQuery.id) || generateQueryId(),
      title,
      category,
      description: normalizeText(rawQuery.description),
      query,
      isDefault: Boolean(options.isDefault),
      createdAt: normalizeText(rawQuery.createdAt) || now,
      updatedAt: now
    };
  }

  function serializeQuery(query) {
    return {
      id: query.id,
      title: query.title,
      category: query.category,
      description: query.description,
      query: query.query,
      createdAt: query.createdAt,
      updatedAt: query.updatedAt
    };
  }

  async function getStoredQueries() {
    const result = await window.extCompat.storageGet({ [STORAGE_KEY]: [] });
    const stored = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];

    return stored.reduce((collection, item) => {
      try {
        collection.push(normalizeQuery(item));
      } catch (error) {
        console.warn("Skipping invalid stored query", error);
      }

      return collection;
    }, []);
  }

  async function persistQueries(queries) {
    await window.extCompat.storageSet({ [STORAGE_KEY]: queries });
    return queries;
  }

  window.QueryVaultStorage = {
    normalizeQuery,

    async getCustomQueries() {
      return getStoredQueries();
    },

    async createCustomQuery(input) {
      const queries = await getStoredQueries();
      const query = normalizeQuery(input);
      queries.push(query);
      await persistQueries(queries);
      return query;
    },

    async updateCustomQuery(id, input) {
      const queries = await getStoredQueries();
      const index = queries.findIndex((query) => query.id === id);

      if (index === -1) {
        throw new Error("Custom query not found.");
      }

      queries[index] = {
        ...queries[index],
        ...normalizeQuery({ ...queries[index], ...input, id: queries[index].id, createdAt: queries[index].createdAt })
      };

      await persistQueries(queries);
      return queries[index];
    },

    async deleteCustomQuery(id) {
      const queries = await getStoredQueries();
      const nextQueries = queries.filter((query) => query.id !== id);
      await persistQueries(nextQueries);
      return nextQueries;
    },

    async exportCustomQueries() {
      const queries = await getStoredQueries();

      return {
        schemaVersion: EXPORT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        defaultQueries: window.DEFAULT_QUERY_LIBRARY.map((query) => serializeQuery(query)),
        customQueries: queries.map((query) => serializeQuery(query))
      };
    },

    async importCustomQueries(parsedJson) {
      let sourceQueries;

      if (Array.isArray(parsedJson)) {
        sourceQueries = parsedJson;
      } else if (parsedJson && typeof parsedJson === "object" && Array.isArray(parsedJson.customQueries)) {
        sourceQueries = parsedJson.customQueries;
      } else {
        throw new Error("Imported JSON must be an array or an export object with customQueries.");
      }

      const normalizedQueries = sourceQueries.map((item) => normalizeQuery(item));
      await persistQueries(normalizedQueries);
      return normalizedQueries;
    }
  };
})();