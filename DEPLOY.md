# Deployment Notes

The public portfolio can be deployed as static files on Netlify or GitHub Pages.

The Admin panel needs the FastAPI backend. Static hosting cannot run:

- Python / FastAPI
- SQLite database writes
- SMTP email sending

## Deploy Backend on Render

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from this repository.
3. Render will read `render.yaml` and deploy `backend` as a Python web service.
4. Add the required secret environment variables in Render.
5. Copy the backend URL, for example:

```js
https://your-portfolio-api.onrender.com
```

6. Put it in both files:

```js
// admin/config.js
window.PORTFOLIO_API_ORIGIN = "https://your-portfolio-api.onrender.com";
```

```js
// portfolio/config.js
window.PORTFOLIO_API_ORIGIN = "https://your-portfolio-api.onrender.com";
```

7. Redeploy the static site.

## Important

This project currently uses SQLite. On many free hosting services, local SQLite data may reset on redeploy.
For long-term production admin editing, use a managed database or a persistent disk.
