// SPDX-License-Identifier: AGPL-3.0-or-later
import { ROUTES } from "@/constants/routes";
import { MyBookings } from "./my-bookings.view";
export const myBookingsRoute = {
  path: ROUTES.bookings,
  element: <MyBookings />,
};
