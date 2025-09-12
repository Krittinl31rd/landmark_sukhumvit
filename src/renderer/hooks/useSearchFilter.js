import { useState, useMemo } from "react";

export function useSearchFilter(data, config = {}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({});

  // filtering logic
  const filteredData = useMemo(() => {
    let result = data;

    // apply search
    if (query.trim()) {
      const lower = query.toLowerCase();
      result = result.filter((item) =>
        config.searchKeys?.some((key) =>
          String(item[key] || "")
            .toLowerCase()
            .includes(lower)
        )
      );
    }

    // apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        result = result.filter((item) => item[key] == value);
      }
    });

    return result;
  }, [data, query, filters, config.searchKeys]);

  return { query, setQuery, filters, setFilters, filteredData };
}
