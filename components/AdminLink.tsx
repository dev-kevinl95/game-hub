"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TOKEN_KEY = "gamePortalToken";

export function AdminLink() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(localStorage.getItem(TOKEN_KEY) !== null);

    const onStorage = () => {
      setHasToken(localStorage.getItem(TOKEN_KEY) !== null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!hasToken) return null;

  return (
    <Link href="/admin" className="nav-link">
      Admin
    </Link>
  );
}
