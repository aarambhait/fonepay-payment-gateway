import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// Deployed to Cloudflare at a domain root. Update `site` if the domain changes.
export default defineConfig({
  site: "https://aarambhait.github.io",
  integrations: [
    starlight({
      title: "Nepal Payment Docs",
      description:
        "Community developer guides for integrating Nepal payment gateways. Starts with Fonepay Dynamic QR and Checkout by Fonepay.",
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/aarambhait/fonepay-payment-gateway" },
      ],
      editLink: {
        baseUrl: "https://github.com/aarambhait/fonepay-payment-gateway/edit/main/",
      },
      sidebar: [
        { label: "Getting started", items: [{ autogenerate: { directory: "getting-started" } }] },
        {
          label: "Fonepay",
          items: [
            { slug: "fonepay" },
            { label: "Dynamic QR", items: [{ autogenerate: { directory: "fonepay/dynamic-qr" } }] },
            { label: "Checkout by Fonepay", items: [{ autogenerate: { directory: "fonepay/checkout" } }] },
            { slug: "fonepay/known-issues" },
          ],
        },
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
        { label: "About", items: [{ autogenerate: { directory: "about" } }] },
      ],
    }),
  ],
});
