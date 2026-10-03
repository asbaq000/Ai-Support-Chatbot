# Assistly frontend

The React interface for the Assistly customer support portfolio project.

See the [main README](../README.md) for project screenshots, full setup, optional Gemini configuration, and demo scope.

## Development

```sh
npm ci
npm start
```

The development server opens at http://localhost:3000 and proxies `/api` to the Flask backend at http://127.0.0.1:5000. Start that backend from the repository root with `python app.py`. Without API credentials, the browser uses scripted sample responses.

## Build and test

```sh
npm run build
npm test -- --watchAll=false --runInBand
```

The build output is served by Flask. Generated build files are not committed.

Edit `src/content.js` to customize sample topics, articles, and responses, `src/App.css` for the visual system, and `public/brand.svg` for the brand mark. For a separate backend, set the public URL in `REACT_APP_API_URL` before building. API keys belong only on the Flask server.
