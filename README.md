# PrimeXshop – Free Fire Diamond Top Up

Free Fire diamond top-up website (Bangla UI) for bKash, Nagad and Rocket payments.

## Files

- `index.html` – the full frontend (single file, no build step needed)

## How it works

The page sends orders to a backend endpoint set in `CONFIG.ORDER_ENDPOINT` (default `/api/order`).
The backend must:

1. Receive `{ uid, pack, method }` as JSON.
2. Validate the UID and pack on the server.
3. Call the reseller API with the secret key (never put the API key in the frontend).
4. Return `{ payment_url }` when payment is needed, or a success message.

## Run locally

Open `index.html` in a browser. Without a backend, the page shows a demo message.

## Deploy

GitHub Pages can host `index.html` for the frontend only. The `/api/order` backend must be hosted separately (for example on Render, Railway, or Vercel Functions).

## Security

- Keep reseller API keys and admin passwords on the server, not in `index.html`.
- Do not commit `.env` files (see `.gitignore`).
