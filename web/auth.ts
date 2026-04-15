import NextAuth from "next-auth";
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    MicrosoftEntraId({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // Explicitly set the tenant-specific issuer so the provider never falls
      // back to the /common endpoint, which is rejected for single-tenant apps.
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ account, profile }) {
      // Enforce single-tenant lock — reject any account whose token tenant ID
      // does not exactly match the configured AZURE_AD_TENANT_ID.
      // We use the `tid` claim from the OIDC id_token (decoded into `profile`)
      // rather than the email domain, because domain alone can be spoofed via
      // external/guest accounts on other tenants.
      if (account?.provider === "microsoft-entra-id") {
        const tid = (profile as { tid?: string } | undefined)?.tid;
        return tid === process.env.AZURE_AD_TENANT_ID;
      }
      return false;
    },
  },
});
