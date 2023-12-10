import { TOKEN, API_PATH } from './env.js';
import { addSuggestions } from '../../store/store.js';

export const suggestionsDomain = async (domain, searchType, filters) => {
    let endpoint = '';

    switch (searchType) {
        case 'default':
            endpoint = `${API_PATH}domains/suggestions?domain=${domain}&limit=20&offset=0`;
            break;
        case 'ai':
            endpoint = `${API_PATH}ai/suggestions?prompt=${domain}&limit=10`;
            break;
        case 'premium':
            const {
                nameMatch,
                available,
                reserved,
                referral,
                limitRange,
                offsetRange,
            } = filters
            console.log(filters);
            endpoint = `${API_PATH}domains/premiums?name=${domain}&nameMatch=${nameMatch}&priceMin=9.95&priceMax=9.95&symbolsMin=1&symbolsMax=10&available=${available}&reserved=${reserved}&referral=${referral}&limit=${limitRange}&offset=${offsetRange}`;
            break;
        default:
            console.error('Invalid searchType:', searchType);
            return;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'en',
                'Authorization': `Bearer ${TOKEN}`
            },
        });

        if (response.ok) {
            const data = await response.json();
            const newSuggestions = data?._embedded?.items || [];

            addSuggestions(newSuggestions);
        } else {
            console.error('Ошибка при выполнении запроса:', response.statusText);
        }
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.message);
    }
};

