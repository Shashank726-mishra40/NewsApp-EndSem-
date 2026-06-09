const NEWS_ENDPOINT = "/api/news";
const TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const DEFAULT_QUERY = "India";

let currentLanguage = "en";
let lastQuery = DEFAULT_QUERY;
let currentArticles = [];
let curSelectedNav = null;
let activeRequest = null;

const translationCache = new Map();

const cardsContainer = document.getElementById("cards-container");
const newsCardTemplate = document.getElementById("template-news-card");
const statusMessage = document.getElementById("status-message");
const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");
const langToggle = document.getElementById("lang-toggle");
const themeToggle = document.getElementById("theme-toggle");
const navItems = document.querySelectorAll(".nav-item");

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.classList.add(savedTheme);
    updateThemeButton(savedTheme === "dark");

    navItems.forEach((item) => {
        item.addEventListener("click", () => onNavItemClick(item));
    });

    searchButton.addEventListener("click", handleSearch);
    searchText.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    langToggle.addEventListener("click", async () => {
        currentLanguage = currentLanguage === "en" ? "hi" : "en";
        langToggle.textContent = currentLanguage === "en" ? "हिन्दी" : "English";
        await bindData(currentArticles);
    });

    themeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark");
        document.body.classList.toggle("light", !isDark);
        updateThemeButton(isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });

    fetchNews(lastQuery);
});

async function fetchNews(query) {
    lastQuery = query;
    setStatus(`Loading ${query} news...`);
    cardsContainer.innerHTML = "";

    if (activeRequest) {
        activeRequest.abort();
    }

    const request = new AbortController();
    activeRequest = request;

    try {
        const params = new URLSearchParams({ q: query });
        const res = await fetch(`${NEWS_ENDPOINT}?${params.toString()}`, {
            signal: request.signal,
        });
        const data = await res.json();

        if (!res.ok || data.status === "error") {
            throw new Error(data.message || "Unable to load news right now.");
        }

        currentArticles = Array.isArray(data.articles) ? data.articles : [];
        await bindData(currentArticles);
    } catch (error) {
        if (error.name === "AbortError") return;
        currentArticles = [];
        cardsContainer.innerHTML = "";
        setStatus(error.message || "Something went wrong. Please try again.");
    } finally {
        if (activeRequest === request) {
            activeRequest = null;
        }
    }
}

async function translateText(text, targetLang) {
    if (!text) return "";

    const key = `${targetLang}:${text}`;

    if (translationCache.has(key)) {
        return translationCache.get(key);
    }

    try {
        const params = new URLSearchParams({
            client: "gtx",
            sl: "auto",
            tl: targetLang,
            dt: "t",
            q: text,
        });
        const response = await fetch(`${TRANSLATE_ENDPOINT}?${params.toString()}`);

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
    cardsContainer.innerHTML = "";

    const validArticles = articles.filter(article => article.url && article.urlToImage);

    if (!validArticles.length) {
        setStatus("No articles found. Try another topic.");
        return;
    }

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

    setStatus("");
}

async function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsSource = cardClone.querySelector("#news-source");
    const newsDesc = cardClone.querySelector("#news-desc");

    newsImg.src = article.urlToImage;
    newsImg.alt = article.title || "News image";
    newsImg.loading = "lazy";
    newsImg.onerror = () => {
        newsImg.src = "https://via.placeholder.com/400x200?text=No+Image";
    };

    let title = article.title || "";
    let desc = article.description || "";

    if (currentLanguage === "hi") {
        title = await translateText(title, "hi");
        desc = await translateText(desc, "hi");
    }

    newsTitle.textContent = title || "Untitled story";
    newsDesc.textContent = desc || "Open the story to read more.";

    const publishedAt = article.publishedAt ? new Date(article.publishedAt) : null;
    const date = publishedAt && !Number.isNaN(publishedAt.getTime())
        ? publishedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : "Recently";

    newsSource.textContent = `${article.source?.name || "Unknown source"} · ${date}`;

    cardClone.firstElementChild.addEventListener("click", () => {
        window.open(article.url, "_blank", "noopener,noreferrer");
    });
}

function onNavItemClick(navItem) {
    const query = navItem.dataset.query;
    fetchNews(query);

    curSelectedNav?.classList.remove("active");
    curSelectedNav = navItem;
    curSelectedNav.classList.add("active");
}

function handleSearch() {
    const query = searchText.value.trim();

    if (!query) return;

    fetchNews(query);

    curSelectedNav?.classList.remove("active");
    curSelectedNav = null;
}

function setStatus(message) {
    statusMessage.textContent = message;
    statusMessage.hidden = !message;
}

function updateThemeButton(isDark) {
    themeToggle.textContent = isDark ? "Light" : "Dark";
}
