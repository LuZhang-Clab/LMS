export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Custom Cursor Canvas */}
      <canvas id="cursor-canvas"></canvas>

      {/* Splash Screen */}
      <div id="splash">
        <canvas id="splash-canvas"></canvas>
        <div className="splash-text-wrap">
          <div className="splash-brand" id="splash-brand">LUMOS CREATIVE</div>
          <div className="splash-sub" id="splash-sub">里面是·创意事务</div>
        </div>
      </div>

      {children}
    </>
  );
}
