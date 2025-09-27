document.addEventListener('DOMContentLoaded', () => {
    const countrySelect = document.getElementById('country-select');
    const providerSelect = document.getElementById('provider-select');
    const goButton = document.getElementById('go-button');

    let allProviders = [];
    let countryCodeToNameMap = {};
    let continentCountryMap = {};
    let countryToContinentMap = {};

    // --- Main Initialization ---
    async function init() {
        try {
            // Fetch all data sources in parallel
            const [providers, countries, continentMap] = await Promise.all([
                fetchProviders(),
                fetchCountries(),
                fetchContinentMap()
            ]);

            allProviders = providers;
            continentCountryMap = continentMap;
            
            buildCountryMap(countries);
            buildCountryToContinentMap();
            populateCountrySelector(); // Now uses the map

            // Initially, ensure the provider dropdown is empty and disabled
            resetProviderSelect();

            // Add event listener for when the user changes the country
            countrySelect.addEventListener('change', renderProviders);

            // Add event listener for provider selection to enable/disable the Go button
            providerSelect.addEventListener('change', () => {
                // Enable the button only if a valid provider URL is selected
                goButton.disabled = !providerSelect.value;
            });

            // Add event listener for the Go button to redirect
            goButton.addEventListener('click', () => {
                const url = providerSelect.value;
                if (url) {
                    window.open(url, '_blank');
                }
            });
        } catch (error) {
            console.error("Initialization failed:", error);
        }
    }

    // --- Data Fetching ---
    async function fetchProviders() {
        // Replace with your actual raw GitHub URL
        const url = 'https://raw.githubusercontent.com/Andy-bm-finance/bm-website-data/refs/heads/main/providers.json';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch providers.json');
        }
        return await response.json();
    }

    async function fetchCountries() {
        // Replace with your actual raw GitHub URL
        const url = 'https://raw.githubusercontent.com/Andy-bm-finance/bm-website-data/refs/heads/main/countries.json';
        const response = await fetch(url);
        if (!response.ok) {
            // This is not critical, so we can just warn and continue
            console.warn('Failed to fetch countries.json, dropdown will show codes.');
            return [];
        }
        return await response.json();
    }

    async function fetchContinentMap() {
        const url = 'https://raw.githubusercontent.com/Andy-bm-finance/bm-website-data/refs/heads/main/continent-country-map.json';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch continent-country-map.json');
        }
        return await response.json();
    }

    // --- UI Rendering ---
    function buildCountryMap(countries) {
        // Creates a mapping from country code to country name
        countries.forEach(country => {
            countryCodeToNameMap[country.code] = country.name;
        });
    }

    function buildCountryToContinentMap() {
        // Creates a reverse map from country code to its continent name
        for (const continent in continentCountryMap) {
            continentCountryMap[continent].forEach(countryCode => {
                countryToContinentMap[countryCode] = continent;
            });
        }
    }

    function populateCountrySelector() {
        // Get all country codes directly from the map we built from countries.json
        const allCountryCodes = Object.keys(countryCodeToNameMap);

        // Sort by country name if available, otherwise by code
        const sortedCountryCodes = allCountryCodes.sort((a, b) => {
            const nameA = countryCodeToNameMap[a] || a;
            const nameB = countryCodeToNameMap[b] || b;
            return nameA.localeCompare(nameB);
        });
        
        // Add a placeholder option
        countrySelect.innerHTML = '<option value="" disabled selected>Select a Country...</option>';

        sortedCountryCodes.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = countryCodeToNameMap[code] || code; // Use full name, fallback to code            
            countrySelect.appendChild(option);
        });

        // Set the initial value to empty to show the placeholder
        countrySelect.value = "";
    }

    function resetProviderSelect() {
        // Clear provider dropdown and disable it
        providerSelect.innerHTML = '<option value="" disabled selected>Select a provider</option>';
        providerSelect.disabled = true;
        goButton.hidden = false; // Ensure button is always visible
        goButton.disabled = true; // But disabled initially
    }

    function renderProviders() {
        const selectedCountry = countrySelect.value;
        const selectedContinent = countryToContinentMap[selectedCountry];
        resetProviderSelect();

        // If no country is selected, don't render anything
        if (!selectedCountry) {
            return;
        }

        // 1. Find country-specific providers
        const countrySpecific = allProviders.filter(p => p.supported_countries.includes(selectedCountry));

        // 2. Find continent-specific providers
        const continentSpecific = selectedContinent 
            ? allProviders.filter(p => p.supported_countries.includes(selectedContinent))
            : [];

        // 3. Find global providers
        const global = allProviders.filter(p => p.supported_countries.includes('GLOBAL'));

        // Combine lists and remove duplicates, preserving the order of priority
        const combined = [...countrySpecific, ...continentSpecific, ...global];
        const uniqueProviderUrls = new Set();
        const filteredProviders = combined.filter(provider => {
            if (!uniqueProviderUrls.has(provider.url)) {
                uniqueProviderUrls.add(provider.url);
                return true;
            }
            return false;
        });

        // Populate the new provider dropdown
        if (filteredProviders.length > 0) {
            providerSelect.disabled = false;
            filteredProviders.forEach(provider => {
                const option = new Option(provider.name, provider.url); // A cleaner way to create options
                providerSelect.appendChild(option);
            });

            // Select the first provider by default and enable the Go button
            providerSelect.value = filteredProviders[0].url;
            goButton.disabled = false;
        }
    }

    // --- Start the App ---
    init();
});