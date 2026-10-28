// SPDX-License-Identifier: AGPL-3.0-or-later
// Full-page navigations leave the single-page application (for example, to an
// identity provider). Wrapped so tests can observe them without leaving.
export const navigationService = {
  assign(url: string) {
    window.location.assign(url);
  },
};
