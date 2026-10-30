// SPDX-License-Identifier: AGPL-3.0-or-later
// Hours of the coming week as a table: one row per day, closed days said in words.
export function OpeningHours({
  caption,
  dayHeader,
  hoursHeader,
  days,
}: {
  caption: string;
  dayHeader: string;
  hoursHeader: string;
  days: { date: string; label: string; hours: string; closed: boolean }[];
}) {
  return (
    <table className="opening-hours">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{dayHeader}</th>
          <th scope="col">{hoursHeader}</th>
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day.date} className={day.closed ? "closed" : undefined}>
            <th scope="row">{day.label}</th>
            <td>{day.hours}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
