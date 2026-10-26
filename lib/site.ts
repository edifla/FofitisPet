// Endereço público do site (APP_URL), usado em metadados, sitemap e e-mails.
export function siteUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
