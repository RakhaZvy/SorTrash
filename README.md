# SorTrash

Web app for classifying waste using a camera or uploaded images. Built with Next.js.

Live: [sor-trash.vercel.app](https://sor-trash.vercel.app)

## Features

- **Classify** - Upload a photo or take one with your camera. The app identifies the waste type and shows a disposal tip.
- **Live Tracking** - Point your webcam at waste items for real-time detection with bounding box overlays.
- **Dashboard** - View your classification history and category breakdown.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The backend must be running separately. Set the URL in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

See [sortrash-service](https://github.com/RakhaZvy/sortrash-service) for backend setup.

## Build

```bash
npm run build
npm start
```
