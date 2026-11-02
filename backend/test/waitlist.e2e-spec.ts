// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import type { Type } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Agent,
  type Tenant,
  addResources,
  citizen,
  del,
  facility,
  harness,
  patch,
  post,
  setup,
  slotStatus,
  start,
  teardown,
  tenant,
} from "./harness";
const require = createRequire(import.meta.url);
interface Folded<T> {
  fold<R>(ok: (value: T) => R, err: (error: unknown) => R): R;
}
interface Locator {
  get<A, T>(type: Type): { execute(args: A): Promise<Folded<T>> };
}
beforeAll(setup);
afterAll(teardown);
function value<T>(result: Folded<T>): T {
  return result.fold(
    (ok) => ok,
    (error) => {
      throw new Error(JSON.stringify(error));
    },
  );
}
// Loaded lazily: the compiled modules read DATABASE_URL, which setup() points at the test database.
function worker() {
  const load = <T>(path: string) => require(`../dist/${path}.js`) as T;
  const { Commands } = load<{ Commands: Type<Locator> }>(
    "v2/shared/infrastructure/commands.locator",
  );
  const commands = harness.app.get(Commands);
  const command = (path: string, name: string) =>
    commands.get(load<Record<string, Type>>(path)[name]);
  return {
    expire: async (tenantId: string) =>
      value(
        (await command(
          "v2/modules/waitlist/application/commands/expire-waitlist-offers.command",
          "ExpireWaitlistOffers",
        ).execute({ tenantId })) as Folded<{
          expired: number;
          deleted: number;
        }>,
      ),
    claim: async () =>
      value(
        (await command(
          "v2/modules/notifications/application/commands/claim-deliveries.command",
          "ClaimDeliveries",
        ).execute({ limit: 50 })) as Folded<{ id: string; kind: string }[]>,
      ),
  };
}
function book(
  agent: Agent,
  facilityId: string,
  begins: string,
  extra: { resourceId?: string; waitlistEntryId?: string } = {},
) {
  return post(agent, "citizen/bookings", {
    id: randomUUID(),
    facilityId,
    start: begins,
    ...extra,
  });
}
function join(
  agent: Agent,
  facilityId: string,
  begins: string,
  resourceId?: string,
) {
  return post(agent, "citizen/waitlist", {
    id: randomUUID(),
    facilityId,
    resourceId,
    start: begins,
  });
}
interface Entry {
  id: string;
  status: "waiting" | "offered";
  position: number;
  offerExpiresAt: string | null;
  facilityName: string;
}
async function entries(agent: Agent) {
  return (await agent.get("/v2/citizen/waitlist").expect(200)).body as Entry[];
}
async function people(context: Tenant, count: number) {
  const agents: Agent[] = [];
  for (let index = 0; index < count; index++)
    agents.push((await citizen(context, `Persoa ${index}`)).agent);
  return agents;
}
/** Moves an open offer's deadline into the past, as if its time were up. */
async function timeUp(entryId: string) {
  await harness.db.query(
    "UPDATE waitlist_entries SET offer_expires_at=now() - interval '1 minute' WHERE id=$1",
    [entryId],
  );
}
async function offerMessages(context: Tenant) {
  return (
    await harness.db.query<{ waitlist_entry_id: string; channel: string }>(
      "SELECT waitlist_entry_id, channel FROM outbox WHERE tenant_id=$1 AND kind='waitlist_offer' ORDER BY created_at",
      [context.id],
    )
  ).rows;
}
/** A court booked by the tenant's citizen at `begins`, with the booking id. */
async function fullCourt(context: Tenant, begins = start(2, 10)) {
  const court = await facility(context);
  const booking = (await book(context.citizen, court.id, begins).expect(201))
    .body as { id: string };
  return { court, begins, booking: booking.id };
}
describe("Waiting list for full slots (#96) through HTTP and PostgreSQL", () => {
  it("should offer a freed slot to the first person, hold it from others and pass it on when the offer expires", async () => {
    const context = await tenant();
    const { court, begins, booking } = await fullCourt(context);
    const [first, second, other] = await people(context, 3);
    await join(first, court.id, begins).expect(201);
    await join(second, court.id, begins).expect(201);
    expect(await entries(second)).toMatchObject([
      { status: "waiting", position: 2 },
    ]);
    await patch(context.citizen, `citizen/bookings/${booking}`, {
      status: "cancelled",
    }).expect(204);
    const [offer] = await entries(first);
    expect(offer).toMatchObject({ status: "offered", position: 0 });
    expect(offer.offerExpiresAt).not.toBeNull();
    expect(await entries(second)).toMatchObject([
      { status: "waiting", position: 1 },
    ]);
    // The held place is not free for anyone else.
    expect(await slotStatus(context, court.id, begins)).toBe("booked");
    await book(other, court.id, begins).expect(409);
    expect(await offerMessages(context)).toEqual([
      { waitlist_entry_id: offer.id, channel: "email" },
    ]);
    const notices = (await first.get("/v2/citizen/notifications").expect(200))
      .body as { kind: string; bookingId: string | null }[];
    expect(notices[0]).toMatchObject({
      kind: "waitlist_offer",
      bookingId: null,
    });
    await timeUp(offer.id);
    const { expire, claim } = worker();
    expect(await expire(context.id)).toMatchObject({ expired: 1 });
    expect(await entries(first)).toEqual([]);
    const [next] = await entries(second);
    expect(next).toMatchObject({ status: "offered" });
    // The first person can no longer take it with the expired offer.
    await book(first, court.id, begins, { waitlistEntryId: offer.id }).expect(
      409,
    );
    await book(second, court.id, begins, {
      waitlistEntryId: next.id,
    }).expect(201);
    expect(await entries(second)).toEqual([]);
    expect(await slotStatus(context, court.id, begins)).toBe("booked");
    // Repeated passes send nothing more: one offer each, closed once taken or expired.
    expect(await expire(context.id)).toMatchObject({ expired: 0 });
    expect((await offerMessages(context)).length).toBe(2);
    await harness.db.query(
      "UPDATE users SET email=id || '@example.invalid' WHERE tenant_id=$1",
      [context.id],
    );
    await claim();
    const closed = (
      await harness.db.query<{ last_error: string | null }>(
        "SELECT last_error FROM outbox WHERE tenant_id=$1 AND kind='waitlist_offer' ORDER BY created_at",
        [context.id],
      )
    ).rows;
    expect(closed.map((row) => row.last_error)).toEqual([
      "skipped:offer_closed",
      "skipped:offer_closed",
    ]);
    // Only entries of slots still to come are transferred; outcomes go without people.
    const pack = (await context.manager.get("/v2/manager/export").expect(200))
      .body as {
      waitlistEntries: { id: string; status: string }[];
      waitlistOutcomes: { accepted: number; expired: number }[];
    };
    expect(pack.waitlistEntries).toMatchObject([
      { id: offer.id, status: "expired" },
      { id: next.id, status: "accepted" },
    ]);
    expect(pack.waitlistOutcomes).toMatchObject([{ accepted: 1, expired: 1 }]);
    const insights = (
      await context.manager.get("/v2/manager/insights").expect(200)
    ).body as { waitlistAccepted: number; waitlistExpired: number };
    expect(insights).toMatchObject({ waitlistAccepted: 1, waitlistExpired: 1 });
  });
  it("should only let people wait for a full slot they could book, once and within the limit", async () => {
    const context = await tenant();
    const { court, begins } = await fullCourt(context);
    const [person] = await people(context, 1);
    const free = start(2, 11);
    expect((await join(person, court.id, free).expect(409)).body).toMatchObject(
      { code: "slot_available" },
    );
    expect(
      (await join(context.citizen, court.id, begins).expect(409)).body,
    ).toMatchObject({ code: "already_booked" });
    await join(person, court.id, begins).expect(201);
    expect(
      (await join(person, court.id, begins).expect(409)).body,
    ).toMatchObject({ code: "already_waiting" });
    await harness.db.query(
      "UPDATE municipalities SET waitlist_max_entries=1 WHERE id=$1",
      [context.id],
    );
    const later = start(3, 10);
    await book(context.citizen, court.id, later).expect(201);
    expect(
      (await join(person, court.id, later).expect(422)).body,
    ).toMatchObject({ code: "waitlist_limit" });
    await patch(context.manager, "manager/municipality", {
      waitlistMaxEntries: 0,
    }).expect(200);
    const [newcomer] = await people(context, 1);
    expect(
      (await join(newcomer, court.id, begins).expect(422)).body,
    ).toMatchObject({ code: "waitlist_disabled" });
    const managed = (
      await context.manager
        .get("/v2/manager/bookings")
        .query({
          date: Temporal.Instant.from(begins)
            .toZonedDateTimeISO("Europe/Madrid")
            .toPlainDate()
            .toString(),
        })
        .expect(200)
    ).body as { start: string; waiting: number }[];
    expect(managed.find((row) => row.start === begins)).toMatchObject({
      waiting: 1,
    });
  });
  it("should offer a freed place of a shared lane and keep the lane full while the offer lasts", async () => {
    const context = await tenant();
    const pool = await facility(context);
    const [lane] = await addResources(context, pool.id, [
      { name: "Rúa 1", parentId: pool.id, capacity: 2 },
    ]);
    const begins = start(2, 10);
    const [first, second, waiting, late] = await people(context, 4);
    const taken = (
      await book(first, pool.id, begins, { resourceId: lane }).expect(201)
    ).body as { id: string };
    await book(second, pool.id, begins, { resourceId: lane }).expect(201);
    await join(waiting, pool.id, begins, lane).expect(201);
    await patch(first, `citizen/bookings/${taken.id}`, {
      status: "cancelled",
    }).expect(204);
    const [offer] = await entries(waiting);
    expect(offer.status).toBe("offered");
    expect(await slotStatus(context, pool.id, begins, lane)).toBe("booked");
    await book(late, pool.id, begins, { resourceId: lane }).expect(409);
    await book(waiting, pool.id, begins, {
      resourceId: lane,
      waitlistEntryId: offer.id,
    }).expect(201);
  });
  it("should keep the hold when accepting fails and pass the place on when the person leaves", async () => {
    const context = await tenant();
    const { court, begins } = await fullCourt(context);
    const [first, second] = await people(context, 2);
    await join(first, court.id, begins).expect(201);
    await join(second, court.id, begins).expect(201);
    const booking = (
      (await context.citizen.get("/v2/citizen/bookings").expect(200)).body as {
        id: string;
      }[]
    )[0];
    await patch(context.manager, `manager/bookings/${booking.id}`, {
      status: "cancelled",
      reason: "Avaría na iluminación",
    }).expect(204);
    const [offer] = await entries(first);
    expect(offer.status).toBe("offered");
    // Reaching the booking limit after the offer makes accepting it fail without losing it.
    await harness.db.query(
      "UPDATE municipalities SET max_active_bookings=1 WHERE id=$1",
      [context.id],
    );
    await book(first, court.id, start(3, 10)).expect(201);
    expect(
      (
        await book(first, court.id, begins, {
          waitlistEntryId: offer.id,
        }).expect(422)
      ).body,
    ).toMatchObject({ code: "booking_limit" });
    expect(await entries(first)).toMatchObject([{ status: "offered" }]);
    expect(await slotStatus(context, court.id, begins)).toBe("booked");
    await del(first, `citizen/waitlist/${offer.id}`).expect(204);
    await del(first, `citizen/waitlist/${offer.id}`).expect(204);
    expect(await entries(first)).toEqual([]);
    expect(await entries(second)).toMatchObject([{ status: "offered" }]);
  });
  it("should end the waiting lists of a closed facility and release their holds", async () => {
    const context = await tenant();
    const { court, begins, booking } = await fullCourt(context);
    const [first, second] = await people(context, 2);
    await join(first, court.id, begins).expect(201);
    await join(second, court.id, begins).expect(201);
    await patch(context.citizen, `citizen/bookings/${booking}`, {
      status: "cancelled",
    }).expect(204);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "closed",
      closureReason: "Obras urxentes na cuberta",
    }).expect(204);
    expect(await entries(first)).toEqual([]);
    expect(await entries(second)).toEqual([]);
    const holds = await harness.db.query(
      "SELECT 1 FROM booking_units WHERE tenant_id=$1 AND waitlist_entry_id IS NOT NULL",
      [context.id],
    );
    expect(holds.rowCount).toBe(0);
  });
  it("should export a person's entries and delete them with the account, passing an open offer on", async () => {
    const context = await tenant();
    const { court, begins, booking } = await fullCourt(context);
    const [leaving, next] = await people(context, 2);
    await join(leaving, court.id, begins).expect(201);
    await join(next, court.id, begins).expect(201);
    const exported = (await leaving.get("/v2/citizen/me/export").expect(200))
      .body as { waitlist: { status: string; facilityName: string }[] };
    expect(exported.waitlist).toMatchObject([
      { status: "waiting", facilityName: court.name },
    ]);
    await patch(context.citizen, `citizen/bookings/${booking}`, {
      status: "cancelled",
    }).expect(204);
    expect(await entries(leaving)).toMatchObject([{ status: "offered" }]);
    await del(leaving, "citizen/me").expect(204);
    const left = await harness.db.query(
      "SELECT 1 FROM waitlist_entries w JOIN users u ON u.id=w.user_id WHERE w.tenant_id=$1 AND u.deleted_at IS NOT NULL",
      [context.id],
    );
    expect(left.rowCount).toBe(0);
    expect(await entries(next)).toMatchObject([{ status: "offered" }]);
  });
});
