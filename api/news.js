const NEWS_API_URL = "https://newsapi.org/v2/everything";

export default async function handler(req, res) {
    const query = String(req.query.q || "India").trim();
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
        res.status(500).json({
            status: "error",
            message: "Missing NEWS_API_KEY on the server. Add it to .env.local locally or to deployment environment variables.",
        });
        return;
    }

    if (!query) {
        res.status(400).json({
            status: "error",
            message: "Please provide a search topic.",
        });
        return;
    }

    try {
        const params = new URLSearchParams({
            q: query,
            sortBy: "publishedAt",
            pageSize: "30",
            apiKey,
        });

        const response = await fetch(`${NEWS_API_URL}?${params.toString()}`);
        const data = await response.json();

        res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
        res.status(response.ok ? 200 : response.status).json(data);
    } catch (error) {
        res.status(502).json({
            status: "error",
            message: "Could not reach the news provider. Please try again later.",
        });
    }
}
