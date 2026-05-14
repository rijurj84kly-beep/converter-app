const cryptos = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'tether', symbol: 'USDT', name: 'Tether' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' }
];

const fiats = [
    { id: 'usd', symbol: 'USD', name: 'US Dollar' },
    { id: 'inr', symbol: 'INR', name: 'Indian Rupee' },
    { id: 'eur', symbol: 'EUR', name: 'Euro' },
    { id: 'gbp', symbol: 'GBP', name: 'British Pound' },
    { id: 'jpy', symbol: 'JPY', name: 'Japanese Yen' },
    { id: 'aud', symbol: 'AUD', name: 'Australian Dollar' },
    { id: 'cad', symbol: 'CAD', name: 'Canadian Dollar' }
];

function populateSelects() {
    const fromSelect = document.getElementById('from');
    const toSelect = document.getElementById('to');

    const createOptGroup = (label, items) => {
        const group = document.createElement('optgroup');
        group.label = label;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.symbol})`;
            group.appendChild(option);
        });
        return group;
    };

    fromSelect.appendChild(createOptGroup('Cryptocurrencies', cryptos));
    fromSelect.appendChild(createOptGroup('Fiat Currencies', fiats));

    toSelect.appendChild(createOptGroup('Cryptocurrencies', cryptos));
    toSelect.appendChild(createOptGroup('Fiat Currencies', fiats));

    // Default values
    fromSelect.value = 'bitcoin';
    toSelect.value = 'usd';
}

let currentRate = 0;
let lastFrom = '';
let lastTo = '';

async function getRate(from, to) {
    const isFromCrypto = cryptos.find(c => c.id === from);
    const isToCrypto = cryptos.find(c => c.id === to);
    
    if (isFromCrypto && !isToCrypto) {
        // Crypto to Fiat
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${from}&vs_currencies=${to}`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        return data[from][to];
    } 
    else if (!isFromCrypto && isToCrypto) {
        // Fiat to Crypto
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${to}&vs_currencies=${from}`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        return 1 / data[to][from];
    }
    else if (isFromCrypto && isToCrypto) {
        // Crypto to Crypto
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${from},${to}&vs_currencies=usd`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        return data[from].usd / data[to].usd;
    }
    else {
        // Fiat to Fiat
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${from},${to}`);
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        return data.bitcoin[to] / data.bitcoin[from]; 
    }
}

async function convert() {
    const amountInput = document.getElementById("amount").value;
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    
    if (from === to) {
        currentRate = 1;
        updateUI(amountInput, from, to);
        return;
    }

    if (!amountInput) {
        document.getElementById("result").innerText = "0.00";
        document.getElementById("live-rate").innerText = "";
        return;
    }
    
    document.getElementById("error").classList.add("hidden");

    if (from !== lastFrom || to !== lastTo) {
        document.getElementById("loading").classList.remove("hidden");
        document.getElementById("live-rate").classList.add("hidden");
        
        try {
            currentRate = await getRate(from, to);
            lastFrom = from;
            lastTo = to;
        } catch (error) {
            document.getElementById("error").innerText = "Failed to fetch rate. Please check your connection or try again later.";
            document.getElementById("error").classList.remove("hidden");
            document.getElementById("loading").classList.add("hidden");
            document.getElementById("live-rate").classList.add("hidden");
            return;
        }
        document.getElementById("loading").classList.add("hidden");
        document.getElementById("live-rate").classList.remove("hidden");
    }
    
    updateUI(amountInput, from, to);
}

function updateUI(amountInput, from, to) {
    const amount = parseFloat(amountInput) || 0;
    const result = amount * currentRate;
    
    const formatNumber = (num) => {
        if (num < 0.01 && num > 0) return num.toPrecision(4);
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    };

    const fromSymbol = getSymbol(from);
    const toSymbol = getSymbol(to);

    document.getElementById("result").innerText = `${formatNumber(result)} ${toSymbol}`;
    document.getElementById("live-rate").innerText = `1 ${fromSymbol} = ${formatNumber(currentRate)} ${toSymbol}`;
}

function getSymbol(id) {
    const crypto = cryptos.find(c => c.id === id);
    if (crypto) return crypto.symbol;
    const fiat = fiats.find(f => f.id === id);
    if (fiat) return fiat.symbol;
    return id.toUpperCase();
}

// Ensure swap works perfectly by exchanging the select values
function swap() {
    let fromElement = document.getElementById("from");
    let toElement = document.getElementById("to");
    
    let temp = fromElement.value;
    fromElement.value = toElement.value;
    toElement.value = temp;
    
    convert();
}

function setupTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.setAttribute('data-theme', 'dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    }

    themeBtn.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }
    });
}

// Event Listeners
document.getElementById("amount").addEventListener("input", convert);
document.getElementById("from").addEventListener("change", convert);
document.getElementById("to").addEventListener("change", convert);

// Initialization
populateSelects();
setupTheme();
convert(); // Initial fetch on load
