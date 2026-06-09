const API_KEY = "873aeec6e5604c5eae77d51c5425bad0";
const url = "https://newsapi.org/v2/everything?q=";

let currentLanguage = "en";
let lastQuery = "India";
let currentArticles = [];
let curSelectedNav = null;

const translationCache = new Map();

window.addEventListener("load", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.classList.add(savedTheme);

    themeToggle.textContent = savedTheme === "dark" ? "☀️ Light" : "🌙 Dark";

    fetchNews(lastQuery);
});

function reload() {
    window.location.reload();
}

async function fetchNews(query) {
    lastQuery = query;

    const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
    const data = await res.json();

    currentArticles = data.articles || [];
    bindData(currentArticles);
}

async function translateText(text, targetLang) {
    if (!text) return "";

    const key = `${targetLang}:${text}`;

    if (translationCache.has(key)) {
        return translationCache.get(key);
    }

    try {
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
        );

        const data = await response.json();
        const translatedText = data[0].map(item => item[0]).join("");

        translationCache.set(key, translatedText);
        return translatedText;
    } catch (error) {
        console.log("Translation Error:", error);
        return text;
    }
}

async function bindData(articles) {
    const cardsContainer = document.getElementById("cards-container");
    const newsCardTemplate = document.getElementById("template-news-card");

    cardsContainer.innerHTML = "";

    const validArticles = articles.filter(article => article.urlToImage);

    const cards = await Promise.all(
        validArticles.map(async (article) => {
            const cardClone = newsCardTemplate.content.cloneNode(true);
            await fillDataInCard(cardClone, article);
            return cardClone;
        })
    );

    cards.forEach(card => {
        cardsContainer.appendChild(card);
    });
}

async function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsSource = cardClone.querySelector("#news-source");
    const newsDesc = cardClone.querySelector("#news-desc");

    newsImg.src = article.urlToImage;

    let title = article.title || "";
    let desc = article.description || "";

    if (currentLanguage === "hi") {
        title = await translateText(title, "hi");
        desc = await translateText(desc, "hi");
    }

    newsTitle.innerHTML = title;
    newsDesc.innerHTML = desc;

    const date = new Date(article.publishedAt).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
    });

    newsSource.innerHTML = `${article.source.name} · ${date}`;

    cardClone.firstElementChild.addEventListener("click", () => {
        window.open(article.url, "_blank");
    });
}

function onNavItemClick(id) {
    fetchNews(id);

    const navItem = document.getElementById(id);

    curSelectedNav?.classList.remove("active");
    curSelectedNav = navItem;
    curSelectedNav.classList.add("active");
}

const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

searchButton.addEventListener("click", () => {
    const query = searchText.value.trim();

    if (!query) return;

    fetchNews(query);

    curSelectedNav?.classList.remove("active");
    curSelectedNav = null;
});

const langToggle = document.getElementById("lang-toggle");

langToggle.addEventListener("click", () => {
    currentLanguage = currentLanguage === "en" ? "hi" : "en";

    langToggle.textContent =
        currentLanguage === "en" ? "हिन्दी" : "English";

    bindData(currentArticles);
});

const themeToggle = document.getElementById("theme-toggle");

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    document.body.classList.toggle("light");

    const isDark = document.body.classList.contains("dark");

    themeToggle.textContent = isDark ? "☀️ Light" : "🌙 Dark";

    localStorage.setItem("theme", isDark ? "dark" : "light");
});