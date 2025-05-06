/**
 * Represents the data required to send an email.
 */
export interface EmailData {
  /**
   * The recipient's email address.
   */
  to: string;
  /**
   * The subject of the email.
   */
  subject: string;
  /**
   * The HTML body of the email.
   */
  html: string;
}

/**
 * Asynchronously sends an email.
 *
 * @param emailData The data required to send the email.
 * @returns A promise that resolves when the email is sent successfully.
 */
export async function sendEmail(emailData: EmailData): Promise<void> {
  // TODO: Implement this by calling an email API.
  console.log("Sending email to", emailData.to, "with subject", emailData.subject);
  return Promise.resolve();
}
