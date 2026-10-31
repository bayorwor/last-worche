// The email that carries a sign-in code, in the language the person was using.
export type EmailLanguage = "de" | "en";

export function buildSignInCodeEmail(code: string, validMinutes: number, language: EmailLanguage) {
  if (language === "de") {
    return {
      subject: "Ihr lastWorche-Anmeldecode",
      text: `Ihr Anmeldecode lautet: ${code}\n\nEr ist ${validMinutes} Minuten gültig und kann einmal verwendet werden.\n\nFalls Sie sich nicht anmelden wollten, können Sie diese E-Mail ignorieren.`,
    };
  }
  return {
    subject: "Your lastWorche sign-in code",
    text: `Your sign-in code is: ${code}\n\nIt is valid for ${validMinutes} minutes and can be used once.\n\nIf you did not try to sign in, you can ignore this email.`,
  };
}
