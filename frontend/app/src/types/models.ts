// SPDX-License-Identifier: AGPL-3.0-or-later
export type Locale = "gl" | "es";
/** User categories a municipality can price differently (M2). */
export type Category =
  | "resident"
  | "family"
  | "local_club"
  | "minor"
  | "large_family"
  | "disability"
  | "senior";
/** "general" is the facility's base tariff, paid without a verified category. */
export type TariffCategory = Category | "general";
export interface CategoryPrice {
  category: Category;
  priceCents: number;
}
export interface Tariff {
  category: TariffCategory;
  priceCents: number;
}
export interface UserCategory {
  category: Category;
  status: "requested" | "verified" | "rejected";
  requestedAt: string | null;
  decidedAt: string | null;
}
export interface MyCategories {
  categories: UserCategory[];
  prefersFamilyTariff: boolean;
}
export interface Accessibility {
  unit: string;
  email: string;
  phone: string;
  reviewedOn: string;
  method: "self" | "external";
  exceptions: Record<Locale, string>;
}
export interface Municipality {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  /** Default language; the person's saved choice takes precedence. */
  locale: Locale;
  advanceDays: number;
  cancellationHours: number;
  maxActiveBookings: number;
  contact: string;
  /** Current privacy notice in each language. */
  legalTexts: { gl: string; es: string };
  legalVersion: string;
  retentionMonths: number;
  accessibility: Accessibility;
  reminderHours: number;
  primaryColor: string;
  logoUrl: string | null;
  /** Square icon of the installed app, drawn from the logo (#24). */
  iconUrl: string | null;
  enabledCategories: Category[];
  /** No-shows within the window that block new bookings; 0 disables the penalty. */
  noShowLimit: number;
  noShowWindowDays: number;
  noShowBlockDays: number;
  /** Open waiting-list entries per person (#96); 0 means there is no waiting list. */
  waitlistMaxEntries: number;
  /** Minutes a freed place is held for the person it is offered to. */
  waitlistOfferMinutes: number;
  /** SPDX identifier of the licence of the municipality's open data. */
  dataLicense: "CC-BY-4.0" | "CC-BY-SA-4.0" | "CC0-1.0" | "ODbL-1.0";
  /** Whether page views are counted in the council's own Umami (#25). */
  analytics: boolean;
}
export interface Session {
  userId: string;
  tenantId: string;
  displayName: string;
  role: "citizen" | "manager";
  /** When the session ends; only on the current session (WCAG 2.2.1). */
  expiresAt?: string | null;
}
/** Code from the municipality's sports catalogue (#26). */
export type Sport = string;
/** Illustration and colour of a sport; sports without their own use the generic ones. */
export type SportArt = "padel" | "tennis" | "futsal" | "swimming" | "generic";
/** Text in both official languages; an empty Spanish text falls back to Galician. */
export interface Localized {
  gl: string;
  es: string;
}
export interface SportInfo {
  code: Sport;
  name: Localized;
  position: number;
}
export interface FacilityPhoto {
  id: string;
  /** Versioned, cacheable image URL. */
  url: string;
  alt: Localized;
  position: number;
}
export interface Facility {
  id: string;
  name: string;
  sport: Sport;
  sportName: Localized;
  sportArt: SportArt;
  address: string;
  description: string;
  accessible: boolean;
  status: "active" | "maintenance" | "closed";
  slotMinutes: number;
  priceCents: number;
  prices: CategoryPrice[];
  openingCalendar: string;
  rules: string;
  latitude: number | null;
  longitude: number | null;
  resources: Resource[];
  photos: FacilityPhoto[];
}
export interface FacilityPage {
  items: Facility[];
  total: number;
  page: number;
  pageSize: number;
}
export interface OpeningDay {
  /** Local date, YYYY-MM-DD. */
  date: string;
  /** Local times, HH:MM; empty when closed. */
  hours: { from: string; to: string }[];
  holiday: boolean;
}
export interface FacilityWithSchedule extends Facility {
  /** Opening hours of the next seven days, from today. */
  openingWeek: OpeningDay[];
}
export interface FacilityFilters {
  q: string;
  sport: Sport;
  accessible: boolean;
  hideClosed: boolean;
  page: number;
}
export interface MapSettings {
  tileUrl: string;
  attribution: string;
}
/** A bookable court or space; parts point to their composite through parentId. */
export interface Resource {
  id: string;
  name: string;
  parentId: string | null;
  active: boolean;
  position: number;
}
export interface Slot {
  start: string;
  end: string;
  /** `season`: held by a club's season slot (#17). */
  status: "available" | "booked" | "season" | "activity" | "past";
  /** Shared courts only (#95): places in all and places still free. */
  capacity?: number;
  remaining?: number;
}
export interface ResourceAvailability {
  id: string;
  name: string;
  parentId: string | null;
  active: boolean;
  slots: Slot[];
}
export interface Availability {
  resources: ResourceAvailability[];
}
/** A free slot offered instead of a full one, by usual occupancy (#25). */
export interface SlotSuggestion {
  facilityId: string;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  start: string;
  end: string;
  /** Usual occupancy at that weekday and hour; null without history. */
  occupancyPct: number | null;
  sameFacility: boolean;
}
export interface Booking {
  id: string;
  facilityId: string;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  sport: Sport;
  sportName: Localized;
  sportArt: SportArt;
  start: string;
  end: string;
  tariffCategory: TariffCategory | null;
  priceCents: number | null;
  status: "confirmed" | "cancelled" | "no_show";
  /** A confirmed booking that has ended counts as attended. */
  outcome: "upcoming" | "attended" | "no_show" | "cancelled";
  cancelledBy: "citizen" | "municipality" | null;
  cancellationReason: string | null;
}
/** No-shows against the municipal penalty; blockedUntil is set while bookings are blocked. */
export interface PenaltyStanding {
  enabled: boolean;
  count: number;
  limit: number;
  windowDays: number;
  blockDays: number;
  remaining: number;
  blockedUntil: string | null;
}
export interface Notification {
  id: string;
  /** Null for a waiting-list offer (#96) or an enrolment notice (#97). */
  bookingId: string | null;
  kind:
    | "confirmed"
    | "rescheduled"
    | "cancelled"
    | "cancelled_by_municipality"
    | "no_show"
    | "blocked"
    | "unblocked"
    | "reminder"
    | "waitlist_offer"
    | "enrolment_confirmed"
    | "enrolment_waiting"
    | "enrolment_promoted"
    | "enrolment_removed"
    | "activity_session_cancelled"
    | "activity_cancelled";
  facilityName: string;
  resourceId: string;
  resourceName: string;
  /** The activity of an enrolment notice (#97). */
  activityId?: string | null;
  activityName?: Localized | null;
  /** First name of the person in the adult's care an enrolment notice is about. */
  participantName?: string | null;
  createdAt: string;
  details: {
    reason?: string;
    standing?: Omit<PenaltyStanding, "enabled">;
    /** Until when a waiting-list offer holds the place. */
    offerExpiresAt?: string;
    /** Start of each cancelled date of an activity. */
    dates?: string[];
  } | null;
}
/** A waiting list the person is on (#96): still waiting, or offered a freed place. */
export interface WaitlistEntry {
  id: string;
  facilityId: string;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  start: string;
  end: string;
  status: "waiting" | "offered";
  /** Until when the place is held for the person; set while offered. */
  offerExpiresAt: string | null;
  /** Place among the people still waiting, from 1; 0 while offered. */
  position: number;
  createdAt: string;
}
export interface CalendarFeed {
  active: boolean;
  createdAt: string | null;
}
export interface CalendarFeedLink {
  path: string;
  createdAt: string;
}
export interface Insights {
  total: number;
  confirmed: number;
  cancelled: number;
  occupancy: number;
  facilities: number;
  from: string;
  to: string;
  byFacility: { id: string; name: string; bookings: number }[];
}
export interface Consent {
  legalVersion: string;
  acceptedAt: string;
}
export interface Account {
  userId: string;
  displayName: string;
  role: "citizen" | "manager";
  currentLegalVersion: string;
  consentUpToDate: boolean;
  consents: Consent[];
  bookings: number;
  notifications: number;
  email: string | null;
  locale: Locale | null;
}
export const NOTICE_KINDS = [
  "confirmation",
  "change",
  "cancellation",
  "reminder",
  "penalty",
  "waitlist",
] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];
export type NoticeChannel = "email" | "push";
export type NoticePreferences = Record<
  NoticeKind,
  Record<NoticeChannel, boolean>
>;
export interface NotificationSettings {
  preferences: NoticePreferences;
  push: { available: boolean; publicKey: string | null; devices: number };
}
/** The PushSubscription JSON a browser returns. */
export interface PushDevice {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
export interface AccountExport {
  generatedAt: string;
  municipality: {
    slug: string;
    name: string;
    contact: string;
    legalVersion: string;
    retentionMonths: number;
  };
  profile: { userId: string; displayName: string; role: "citizen" | "manager" };
  consents: Consent[];
  categories: UserCategory[];
  prefersFamilyTariff: boolean;
  bookings: {
    id: string;
    facilityId: string;
    facilityName: string;
    resourceId: string;
    resourceName: string;
    sport: Sport;
    start: string;
    end: string;
    status: Booking["status"];
    createdAt: string;
    cancelledAt: string | null;
    tariffCategory: TariffCategory | null;
    priceCents: number | null;
    cancelledBy: Booking["cancelledBy"];
    cancellationReason: string | null;
  }[];
  notifications: {
    id: string;
    bookingId: string;
    kind: Notification["kind"];
    createdAt: string;
    details: Notification["details"];
  }[];
  blocks: { start: string; end: string; liftedAt: string | null }[];
  auditEvents: {
    id: string;
    action: string;
    resourceId: string;
    occurredAt: string;
    details: Record<string, unknown> | null;
  }[];
}
/** Signed QR pass for one reservation, verifiable at the door without a network. */
export interface AccessPass {
  token: string;
  code: string;
  validFrom: string;
  validUntil: string;
}
export interface CatalogEntry {
  id: string;
  name: string;
  sport: Sport;
  sportName: Localized;
  sportArt: SportArt;
  photo: FacilityPhoto | null;
  address: string;
  description: string;
  accessible: boolean;
  slotMinutes: number;
  priceCents: number;
  municipality: { slug: string; name: string };
}
export interface CatalogPage {
  items: CatalogEntry[];
  total: number;
  page: number;
  pageSize: number;
}
export interface CatalogFilters {
  q: string;
  sport: Sport | "";
  accessible: boolean;
  municipalities: string[];
  page: number;
}
export interface AuthMethods {
  demo: boolean;
  oidc: { label: string } | null;
  email: boolean;
}
/** The club a person represents and its upcoming season slots (#17). */
export interface MyClub {
  organization: { id: string; name: string; sport: Sport | null } | null;
  occurrences: {
    id: string;
    facilityName: string;
    resourceName: string;
    start: string;
    end: string;
  }[];
}
/** An open season campaign with its published priority criteria (#17). */
export interface SeasonCampaign {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  criteria: Record<Locale, string>;
  facilityIds: string[];
}
/** Fixed events of the citizen app (#57); they carry no properties. */
export type AnalyticsEvent =
  "search" | "slot-open" | "booking-confirmed" | "suggestion-picked";

/** The weekly rule of an activity (#97); times are local to the municipality. */
export interface WeeklyRule {
  /** ISO weekdays, 1 = Monday. */
  weekdays: number[];
  startsLocal: string;
  endsLocal: string;
  startsOn: string;
  endsOn: string;
  exceptions: string[];
}
export interface ActivitySession {
  id: string;
  start: string;
  end: string;
  status: "active" | "cancelled";
  cancellationReason: string | null;
}
/** A course or sports school with places, as the public catalogue shows it (#97). */
export interface PublicActivity {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityAddress: string;
  resourceId: string;
  resourceName: string;
  sport: Sport;
  sportName: Localized;
  sportArt: SportArt;
  name: Localized;
  description: Localized;
  rule: WeeklyRule;
  places: number;
  minAge: number | null;
  maxAge: number | null;
  enrolmentOpensOn: string;
  enrolmentClosesOn: string;
  prices: { category: TariffCategory; priceCents: number }[];
  status: "published" | "cancelled";
  cancellationReason: string | null;
  nextSession: string | null;
  /** Whether people can enrol today; `full` means enrolling joins the waiting list. */
  enrolment: "upcoming" | "open" | "full" | "closed";
  freePlaces: number;
  waiting: number;
}
export interface PublicActivityDetails extends PublicActivity {
  /** Upcoming sessions, cancelled ones included. */
  sessions: ActivitySession[];
}
export interface ActivityPage {
  items: PublicActivity[];
  total: number;
  page: number;
  pageSize: number;
}
export interface ActivityFilters {
  sport: string;
  /** Age of the person who would attend; null for any. */
  age: number | null;
  open: boolean;
  facilityId: string;
  page: number;
}
export type EnrolmentStatus =
  "enrolled" | "waiting" | "left" | "removed" | "cancelled";
/** An enrolment of the person in an activity (#97). */
export interface MyEnrolment {
  id: string;
  activityId: string;
  activityName: Localized;
  activityStatus: "draft" | "published" | "cancelled";
  facilityId: string;
  facilityName: string;
  resourceName: string;
  status: EnrolmentStatus;
  /** The person in the adult's care who takes part; null for the adult. */
  participant: { dependantId: string | null; firstName: string } | null;
  /** Place in the waiting list, from 1. */
  position: number | null;
  createdAt: string;
  enrolledAt: string | null;
  endedAt: string | null;
  nextSession: string | null;
  cancelledSessions: number;
}
/** A person in the adult's care (#97): first name and year of birth only. */
export interface Dependant {
  id: string;
  firstName: string;
  birthYear: number;
  declarationVersion: string;
  declaredAt: string;
  createdAt: string;
}
