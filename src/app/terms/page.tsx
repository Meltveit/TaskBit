
"use client"; // Make it a client component to use hooks

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button
import { ArrowLeft } from 'lucide-react'; // Import icon
import { useRouter } from 'next/navigation'; // Import router hook

export default function TermsOfServicePage() {
   const router = useRouter(); // Initialize router

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
      {/* Back Button */}
       <div className="mb-6">
         <Button variant="outline" onClick={() => router.back()}>
           <ArrowLeft className="mr-2 h-4 w-4" /> Back
         </Button>
       </div>

      <Card className="shadow-lg border-border/60">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Terms of Service</CardTitle>
           <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">1. Agreement to Terms</h2>
            <p>
              These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”)
              and TaskBit (“Company“, “we”, “us”, or “our”), concerning your access to and use of the TaskBit website as well as any other
              media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”).
            </p>
             <p className="mt-2">
                You agree that by accessing the Site, you have read, understood, and agreed to be bound by all of these Terms of Service.
                IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND YOU MUST DISCONTINUE USE IMMEDIATELY.
            </p>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-primary mb-3">2. Intellectual Property Rights</h2>
            <p>
              Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs,
              audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos
              contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">3. User Representations</h2>
            <p>
              By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete;
              (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal
              capacity and you agree to comply with these Terms of Service; (4) you are not a minor in the jurisdiction in which you reside; (5) you will
              not access the Site through automated or non-human means, whether through a bot, script, or otherwise; (6) you will not use the Site for any
              illegal or unauthorized purpose; and (7) your use of the Site will not violate any applicable law or regulation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">4. User Registration</h2>
            <p>
              You may be required to register with the Site. You agree to keep your password confidential and will be responsible for all use of your account
              and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such
              username is inappropriate, obscene, or otherwise objectionable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">5. Prohibited Activities</h2>
            <p>
              You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection
              with any commercial endeavors except those that are specifically endorsed or approved by us.
            </p>
            <p className="mt-2">
              As a user of the Site, you agree not to:
            </p>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-muted-foreground">
              <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
              <li>Make any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.</li>
              <li>Use the Site to advertise or offer to sell goods and services.</li>
              <li>Engage in unauthorized framing of or linking to the Site.</li>
              <li>Interfere with, disrupt, or create an undue burden on the Site or the networks or services connected to the Site.</li>
              {/* Add more prohibitions as needed */}
            </ul>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-primary mb-3">6. Term and Termination</h2>
            <p>
              These Terms of Service shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE,
              WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE (INCLUDING BLOCKING CERTAIN IP ADDRESSES),
              TO ANY PERSON FOR ANY REASON OR FOR NO REASON.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">7. Modifications and Interruptions</h2>
            <p>
              We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice.
              We also reserve the right to modify or discontinue all or part of the Site without notice at any time. We will not be liable to you or any third
              party for any modification, price change, suspension, or discontinuance of the Site.
            </p>
             <p className="mt-2">
              We cannot guarantee the Site will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance
              related to the Site, resulting in interruptions, delays, or errors.
             </p>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-primary mb-3">8. Governing Law</h2>
            <p>
              These Terms of Service and your use of the Site are governed by and construed in accordance with the laws of the State of [Your State/Country]
              applicable to agreements made and to be entirely performed within the State of [Your State/Country], without regard to its conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">9. Disclaimer</h2>
             <p>
                THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK.
                TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR USE THEREOF,
                INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-primary mb-3">10. Limitation of Liability</h2>
            <p>
              IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY,
              INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SITE,
              EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary mb-3">11. Contact Us</h2>
            <p>
              In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:
              support@taskbit.com or by post to: [Your Company Address, City, State, Zip Code].
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
