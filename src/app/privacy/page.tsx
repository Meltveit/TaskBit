
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
      <Card className="shadow-lg border-border/60">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">1. Introduction</h2>
            <p>
              Welcome to TaskBit! We are committed to protecting your personal information and your right to privacy.
              If you have any questions or concerns about this privacy notice, or our practices with regards to your
              personal information, please contact us at privacy@taskbit.com.
            </p>
            <p className="mt-2">
              This privacy notice describes how we might use your information if you use our services. It applies to all
              information collected through our website and/or any related services, sales, marketing or events.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">2. What Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the Services,
              express an interest in obtaining information about us or our products and Services, when you participate
              in activities on the Services or otherwise when you contact us.
            </p>
            <p className="mt-2">
              The personal information that we collect depends on the context of your interactions with us and the Services,
              the choices you make and the products and features you use. The personal information we collect may include the following:
            </p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-muted-foreground">
              <li>Names</li>
              <li>Email addresses</li>
              <li>Passwords</li>
              <li>Contact preferences</li>
              <li>Billing addresses</li>
              <li>Payment information (processed by third-party vendors)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">3. How We Use Your Information</h2>
            <p>
              We use personal information collected via our Services for a variety of business purposes described below.
              We process your personal information for these purposes in reliance on our legitimate business interests,
              in order to enter into or perform a contract with you, with your consent, and/or for compliance with our
              legal obligations.
            </p>
             <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-muted-foreground">
               <li>To facilitate account creation and logon process.</li>
               <li>To manage user accounts.</li>
               <li>To send administrative information to you.</li>
               <li>To fulfill and manage your orders.</li>
               <li>To request feedback.</li>
               <li>To protect our Services.</li>
               <li>To respond to legal requests and prevent harm.</li>
             </ul>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-primary mb-3">4. Will Your Information Be Shared?</h2>
            <p>
              We only share information with your consent, to comply with laws, to provide you with services,
              to protect your rights, or to fulfill business obligations. We may process or share your data
              that we hold based on the following legal basis: Consent, Legitimate Interests, Performance of a Contract,
              Legal Obligations, Vital Interests.
            </p>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-primary mb-3">5. Data Retention</h2>
            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this
              privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting or
              other legal requirements).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">6. Security of Your Information</h2>
            <p>
              We have implemented appropriate technical and organizational security measures designed to protect the security
              of any personal information we process. However, despite our safeguards and efforts to secure your information,
              no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
            </p>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-primary mb-3">7. Changes to This Notice</h2>
            <p>
              We may update this privacy notice from time to time. The updated version will be indicated by an updated
              "Last updated" date and the updated version will be effective as soon as it is accessible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">8. Contact Us</h2>
            <p>
              If you have questions or comments about this notice, you may email us at privacy@taskbit.com or by post to:
              [Your Company Address, City, State, Zip Code].
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
