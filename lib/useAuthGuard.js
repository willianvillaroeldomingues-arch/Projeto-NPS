"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabaseClient";

export function useAuthGuard() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      if (!data.session) {
        router.push("/login");
      } else {
        setPronto(true);
      }
    });
    return () => {
      ativo = false;
    };
  }, [router]);

  return pronto;
}
