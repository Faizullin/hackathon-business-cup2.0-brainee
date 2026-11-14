// Shared artwork for generated app icons: a simple Brainy face on coral. No external fonts or images.
export function BrandIcon({ size }: { size: number }) {
  const u = size / 100;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ee5a4a",
        borderRadius: 22 * u,
      }}
    >
      <div
        style={{
          width: 70 * u,
          height: 58 * u,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12 * u,
          background: "#f4a3a0",
          borderRadius: 30 * u,
          border: `${3 * u}px solid #1b1f3b`,
        }}
      >
        {[0, 1].map((eye) => (
          <div
            key={eye}
            style={{
              width: 16 * u,
              height: 16 * u,
              borderRadius: 999,
              background: "#ffffff",
              border: `${3 * u}px solid #1b1f3b`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{ width: 6 * u, height: 6 * u, borderRadius: 999, background: "#1b1f3b" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
