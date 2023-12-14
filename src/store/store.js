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

export const filtersStore = writable({
    nameMatch: 'partial',
    available: true,
    reserved: false,
    referral: false,
    limitRange: 20,
    offsetRange: 0
});
export const setFiltersStore = (newFilters) => {
    filtersStore.set(newFilters)
}

export const searchNamesStore = writable('default');
export const setSearchNamesStore = (newSearchNames) => {
    searchNamesStore.set(newSearchNames)
}