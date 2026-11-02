// The weekly digest email, German first and English below it, because no language is stored per person yet.
import type { DigestWarning, IsoWeek, OrderDigest } from "../domain/weeklyDigest.ts";

type Language = "de" | "en";

const personDays = (value: number, language: Language) => {
  const number = (Math.round(value * 10) / 10).toFixed(1);
  return language === "de" ? `${number.replace(".", ",")} PT` : `${number} PD`;
};

const week = ({ year, week: number }: IsoWeek, language: Language) => (language === "de" ? `KW ${number}/${year}` : `week ${number}/${year}`);

const date = (isoDate: string, language: Language) => {
  const [year, month, day] = isoDate.split("-");
  return language === "de" ? `${day}.${month}.${year}` : `${day}/${month}/${year}`;
};

function warningLine(warning: DigestWarning, language: Language) {
  switch (warning.kind) {
    case "budget-used-up":
      return language === "de" ? "Das Budget ist aufgebraucht." : "The budget is used up.";
    case "order-more": {
      const by = week(warning.orderByWeek, language);
      const size = personDays(warning.followUpPersonDays, language);
      if (language === "de") {
        return warning.isOverdue
          ? `Nachbestellung überfällig: Sie hätte bis ${by} stehen müssen. Vorschlag: ${size}.`
          : `Nachbestellen bis ${by}: Das Budget reicht nicht bis zum Projektende. Vorschlag: ${size}.`;
      }
      return warning.isOverdue
        ? `Follow-up order overdue: it should have been placed by ${by}. Proposal: ${size}.`
        : `Order more by ${by}: the budget will not last until the project end. Proposal: ${size}.`;
    }
    case "follow-up-open":
      return language === "de"
        ? `Ihre Nachbestellung über ${personDays(warning.personDays, language)} wartet auf den Einkauf.`
        : `Your follow-up request for ${personDays(warning.personDays, language)} is waiting for purchasing.`;
  }
}

function section(digest: OrderDigest, leadName: string, language: Language) {
  const de = language === "de";
  const exhaustion =
    digest.forecast.status === "not-enough-data"
      ? de ? "Für eine Prognose reichen die Buchungen noch nicht." : "Not enough bookings for a forecast yet."
      : digest.forecast.exhaustionWeek
        ? `${de ? "Budget reicht voraussichtlich bis" : "Budget expected to run out in"} ${week(digest.forecast.exhaustionWeek, language)}`
        : de ? "Das Budget reicht über die Prognose hinaus." : "The budget lasts beyond the forecast.";
  const warnings = digest.warnings.length
    ? digest.warnings.map((warning) => `- ${warningLine(warning, language)}`).join("\n")
    : de ? "- Keine Warnungen." : "- No warnings.";

  return [
    de ? `Guten Tag ${leadName},` : `Hello ${leadName},`,
    "",
    `${de ? "Auftrag" : "Order"} ${digest.orderId} · ${digest.title}, ${date(digest.weekStart, language)} – ${date(digest.weekEnd, language)}`,
    "",
    `${de ? "Bestellt" : "Ordered"}: ${personDays(digest.orderedPersonDays, language)} · ${de ? "Verbraucht" : "Used"}: ${personDays(digest.usedPersonDays, language)} · ${de ? "Frei" : "Free"}: ${personDays(digest.freePersonDays, language)}`,
    `${de ? "Gebucht in diesem Zeitraum" : "Booked in this period"}: ${personDays(digest.weekPersonDays, language)}`,
    exhaustion,
    "",
    de ? "Warnungen:" : "Warnings:",
    warnings,
    "",
    de
      ? "Sie erhalten diese E-Mail, weil Sie den Wochenbericht in lastWorche eingeschaltet haben. Abbestellen können Sie ihn in Ihrem Profil."
      : "You receive this email because you turned on the weekly digest in lastWorche. You can turn it off in your profile.",
  ].join("\n");
}

export function buildWeeklyDigestEmail(digest: OrderDigest, leadName: string) {
  return {
    subject: `lastWorche: Wochenbericht / Weekly digest ${digest.orderId} (${digest.isoWeek})`,
    text: `${section(digest, leadName, "de")}\n\n— English —\n\n${section(digest, leadName, "en")}`,
  };
}
