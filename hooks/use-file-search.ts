"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function useFileSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    } else {
      params.delete("q");
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    // Deliberately omitted from deps: searchParams/router/pathname would
    // cause this to re-run and potentially fight with the URL on every
    // navigation -- this effect's only real trigger is the debounced query
    // changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  return { query, setQuery, debouncedQuery };
}
