"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    // Fixed overlay so this page appears full-screen regardless of the root layout.
    <div className="fixed inset-0 bg-bg flex items-center justify-center z-50">
      <div className="border border-border bg-surface rounded p-10 w-full max-w-sm">
        <h1 className="text-amber text-lg font-bold tracking-tight mb-1">
          Digital Brain
        </h1>
        <p className="text-text-muted text-xs mb-8">
          personal intelligence console
        </p>
        <button
          onClick={() =>
            signIn("microsoft-entra-id", { callbackUrl: "/" })
          }
          className="w-full px-4 py-2 text-sm border border-amber/30 text-amber rounded hover:bg-amber/10 transition-colors"
        >
          Sign in with Microsoft
        </button>
      </div>
    </div>
  );
}
