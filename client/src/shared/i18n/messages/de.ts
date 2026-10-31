// German is the source of the message keys. en.ts must have exactly the same keys, or the build fails.
export const de = {
  'language.switcherLabel': 'Sprache',

  'header.tagline': 'Jede Stunde im Blick.',
  'header.demoNotice': 'Demo · Daten fiktiv',

  'nav.label': 'Rollenansicht',
  'nav.consultant.title': 'Berater',
  'nav.consultant.subtitle': 'Lieferantenseite · buchen',
  'nav.projectLead.title': 'Projektleitung',
  'nav.projectLead.subtitle': 'Kundenseite · prüfen & steuern',
  'nav.purchasing.title': 'Einkauf',
  'nav.purchasing.subtitle': 'Kundenseite · nur Summen',

  'common.loading': 'Wird geladen …',
  'common.retry': 'Erneut versuchen',

  'orders.selectLabel': 'Auftrag',
  'orders.noneAssigned': 'Ihnen ist noch kein Auftrag zugewiesen.',

  'routeError.message': 'Diese Seite konnte nicht geladen werden.',
  'routeError.reload': 'Seite neu laden',

  'bookings.pageTitle': 'Berater — Zeit buchen',
  'bookings.formPanelTitle': 'Buchung erfassen — ein Satz genügt',
  'bookings.sentenceLabel': 'Was haben Sie gearbeitet?',
  'bookings.sentencePlaceholder': '9 bis 5 am Kundenportal, 1 h Mittag',
  'bookings.checkProposal': 'Vorschlag prüfen',
  'bookings.checkingProposal': 'Wird geprüft …',
  'bookings.proposalLabel': 'Buchungsvorschlag',
  'bookings.proposalHeading': 'Erkannt — bitte bestätigen',
  'bookings.proposalOrder': 'Auftrag {orderId}',
  'bookings.confirm': 'Buchung bestätigen',
  'bookings.confirming': 'Wird gespeichert …',
  'bookings.discard': 'Verwerfen',
  'bookings.saved': 'Buchung gespeichert — die Projektleitung sieht die Auswirkung auf das Budget sofort.',
  'bookings.sessionPanelTitle': 'In dieser Sitzung gebucht',
  'bookings.ownBookingsOnly': 'Nur eigene Buchungen',
  'bookings.noneYet': 'Noch keine Buchungen in dieser Sitzung.',
  'bookings.columnDate': 'Datum',
  'bookings.columnDuration': 'Dauer',
  'bookings.columnActivity': 'Tätigkeit',
  'bookings.columnOrder': 'Auftrag',

  'budget.pageTitle': 'Projektleitung — Aufträge',
  'budget.panelTitle': 'Budget — Auftrag {orderId}',
  'budget.ordered': 'Bestellt',
  'budget.used': 'Verbraucht',
  'budget.free': 'Frei',
  'budget.usedProgressLabel': 'Verbrauchtes Budget',

  'purchasing.pageTitle': 'Einkauf — Rahmensteuerung',
  'purchasing.panelTitle': 'Lieferantenübersicht — nur aggregierte Werte (Σ)',
  'purchasing.sampleData': 'Beispieldaten',
  'purchasing.columnSupplier': 'Lieferant',
  'purchasing.columnOrders': 'Aufträge',
  'purchasing.columnUsed': 'Verbraucht',
  'purchasing.columnFree': 'Frei',
  'purchasing.columnStatus': 'Status',
  'purchasing.followUpNeeded': 'Nachtrag nötig',
  'purchasing.onTrack': 'Im Plan',

  'errors.serverUnavailable': 'Der Server ist gerade nicht erreichbar. Bitte versuchen Sie es erneut.',
  'errors.invalidInput': 'Diese Eingabe ist ungültig. Bitte prüfen Sie sie.',
  'errors.orderNotFound': 'Dieser Auftrag existiert nicht.',
  'errors.aiUnavailable': 'Der KI-Dienst ist nicht verfügbar. Bitte versuchen Sie es später erneut.',
  'errors.aiBusy': 'Der KI-Dienst ist ausgelastet. Bitte versuchen Sie es gleich noch einmal.',
  'errors.aiUnreadable': 'Aus diesem Satz konnte keine Buchung erstellt werden. Bitte formulieren Sie ihn um.',
  'errors.ruleFreeBudget':
    'Diese Buchung benötigt {hours} h, aber Auftrag {orderId} hat nur noch {freePersonDays} PT frei.',
  'errors.ruleAssignedOrder': 'Buchung abgelehnt: Sie sind dem Auftrag {orderId} nicht zugewiesen.',
  'errors.fromServer': '{message}',
} as const

export type MessageKey = keyof typeof de
