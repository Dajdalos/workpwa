export default function Head() {
  return (
    <>
      <title>WorkPWA</title>
      <meta name="description" content="A fast, installable work helper." />
      <meta name="theme-color" content="#0ea5e9" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="icon" href="/icons/icon-192.png" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <script
        dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')); }`
        }}
      />
    </>
  );
}
