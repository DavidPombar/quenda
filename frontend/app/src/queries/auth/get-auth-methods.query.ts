// SPDX-License-Identifier: AGPL-3.0-or-later
import { useQuery } from "@tanstack/react-query";
import { authRepository } from "@/repositories/auth.repository";
// Sign-in methods come from deployment configuration and rarely change.
export function useGetAuthMethodsQuery() {
  return useQuery({
    queryKey: ["auth-methods"],
    queryFn: authRepository.methods,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
