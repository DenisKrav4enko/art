import { writable } from "svelte/store";

export const domainsStore = writable([]);
export const setDomains = (newDomains) => {
    domainsStore.set(newDomains);
};

export const suggestionsTypeStore = writable('');
export const setSuggestionsType = (newSuggestionsType) => {
    suggestionsTypeStore.set(newSuggestionsType)
}

export const suggestionsStore = writable([]);
export const setSuggestions = (newSuggestions) => {
    suggestionsStore.set(newSuggestions);
};
export const addSuggestions = (newSuggestions) => {
    suggestionsStore.update(existingSuggestions => [...existingSuggestions, ...newSuggestions]);
};

export const filtersStore = writable({});
export const setFiltersStore = (newFilters) => {
    filtersStore.set(newFilters)
}

export const searchNamesStore = writable('');
export const setSearchNamesStore = (newSearchNames) => {
    searchNamesStore.set(newSearchNames)
}