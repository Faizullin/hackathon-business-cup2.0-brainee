// Shared artwork for generated app icons: a simple Brainy face on lavender. No external fonts or images.
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
        background: "#f2f1fa",
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
          background: "#ff9ec2",
          borderRadius: 30 * u,
          border: `${3 * u}px solid #1c1b33`,
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
              border: `${3 * u}px solid #1c1b33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{ width: 6 * u, height: 6 * u, borderRadius: 999, background: "#1c1b33" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
