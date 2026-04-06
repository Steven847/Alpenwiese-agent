// app/privacy/page.tsx — Privacy Policy for Meta App Review

export default function Privacy() {
  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "20px 24px", fontFamily: "sans-serif", color: "#333", lineHeight: 1.8 }}>
      <h1 style={{ color: "#1B5E20", fontSize: 24 }}>Datenschutzrichtlinie</h1>
      <h2 style={{ color: "#1B5E20", fontSize: 16 }}>Alpenwiese Social Media Agent</h2>
      <p style={{ fontSize: 13, color: "#888" }}>Stand: April 2026</p>

      <h3 style={{ marginTop: 24, color: "#1B5E20" }}>1. Verantwortlicher</h3>
      <p>YouCann GmbH, Schweiz<br />Kontakt: info@alpenwiese.ch</p>

      <h3 style={{ marginTop: 24, color: "#1B5E20" }}>2. Welche Daten werden verarbeitet</h3>
      <p>Der Alpenwiese Social Media Agent verarbeitet ausschliesslich Daten, die zur Verwaltung und Veroeffentlichung von Inhalten auf Instagram erforderlich sind. Dies umfasst:</p>
      <p>- Instagram Business Account Informationen (Account-ID, Benutzername)<br />
      - Von der App erstellte Inhalte (Bilder, Videos, Captions)<br />
      - OAuth Access Tokens zur Authentifizierung</p>

      <h3 style={{ marginTop: 24, color: "#1B5E20" }}>3. Zweck der Verarbeitung</h3>
      <p>Die Daten werden ausschliesslich verwendet um Inhalte auf dem Instagram-Account des Nutzers zu veroeffentlichen, Insights abzurufen und Kommentare zu verwalten.</p>

      <h3 style={{ marginTop: 24, color: "#1B5E20" }}>4. Datenweitergabe</h3>
      <p>Daten werden ausschliesslich an die Meta/Instagram API uebermittelt, um die oben genannten Funktionen bereitzustellen. Eine Weitergabe an sonstige Dritte findet nicht statt.</p>

      <h3 style={{ marginTop: 24, color: "#1B5E20" }}>5. Datenspeicherung</h3>
      <p>Access Tokens werden verschluesselt auf dem Server gespeichert. Generierte Inhalte werden nur temporaer verarbeitet und nicht dauerhaft gespeichert.</p>

      <h3 style={{ marginTop: 24, color: "#1B5E20" }}>6. Datenlöschung</h3>
      <p>Nutzer koennen jederzeit die Loeschung ihrer Daten beantragen. Durch Widerruf der App-Autorisierung in den Instagram-Einstellungen werden alle Zugriffsrechte sofort entzogen.</p>

      <h3 style={{ marginTop: 24, color: "#1B5E20" }}>7. Kontakt</h3>
      <p>Bei Fragen zum Datenschutz wenden Sie sich an: info@alpenwiese.ch</p>
    </div>
  );
}

