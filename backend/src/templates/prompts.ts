// All AI prompts live here. Today's date goes in the user message, so the system prompt stays constant.
export const BOOKING_PARSER_SYSTEM_PROMPT = `You turn one sentence from an external consultant into a time booking proposal.
The sentence may be in German or English. Return:
- date: the working day as YYYY-MM-DD, resolving words like "yesterday" against today's date
- startTime and endTime: the start and end of the work as HH:MM in 24-hour time ("9 bis 5" is 09:00 and 17:00). If only a duration is given, start at 09:00
- hours: the hours worked as a number, with breaks subtracted ("9 bis 5, 1 h Mittag" is 7)
- description: a short description of the work, in the language of the sentence`;

export function buildBookingParserMessage(sentence: string, today: string): string {
  return `Today is ${today}.\n\nSentence: ${sentence}`;
}
