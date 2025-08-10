export default function OfflinePage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>You’re offline</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>We’ll reconnect as soon as you’re back online.</p>
    </main>
  );
}
