export const metadata = { title: "Construction Pricing" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{fontFamily:"Inter, system-ui, Arial", margin: 24}}>
        <h1>Construction Pricing App</h1>
        <nav style={{display:"flex", gap:12, margin:"12px 0"}}>
          <a href="/">Home</a>
          <a href="/catalog/materials">Materials</a>
          <a href="/catalog/roles">Roles</a>
          <a href="/catalog/equipment">Equipment</a>
          <a href="/activities">Activities</a>
          <a href="/estimates/new">New Estimate</a>
        </nav>
        <hr/>
        <div style={{marginTop:16}}>{children}</div>
      </body>
    </html>
  );
}
