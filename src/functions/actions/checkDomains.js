import { TOKEN, API_PATH } from './env.js';
import { setDomains, suggestionsStore } from '../../store/store.js';
import { suggestionsDomain } from "./suggestionsDomain.js";
import { formatDomain } from "../../utils/parsers";

export const checkDomains = async (searchValue, searchType) => {
    const domains = searchValue.split(/[\s,]+/);
    const domainsQuery = domains.map((domain) => formatDomain(domain));

    try {
        suggestionsStore.set([]);

        const response = await fetch(`${API_PATH}domains/check?${domainsQuery.map(domain => `domains[]=${domain}`).join('&')}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'en',
                'Authorization': `Bearer ${TOKEN}`
            },
        });

        if (response.ok) {
            const data = await response.json();
            const newDomains = data?._embedded?.items || [];

            setDomains(newDomains)

            for (const domain of domainsQuery) {
                await suggestionsDomain(domain, searchType);
            }
        } else {
            console.error('Ошибка при выполнении запроса:', response.statusText);
        }
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.message);
    }
};

