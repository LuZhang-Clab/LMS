export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        body { background: #111 !important; margin: 0 !important; }
      `}</style>
      {children}
    </>
  );
}
