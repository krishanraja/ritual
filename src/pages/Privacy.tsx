import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSEO } from '@/hooks/useSEO';

export default function Privacy() {
  const navigate = useNavigate();

  useSEO({
    title: 'Privacy Policy',
    description: 'Privacy Policy for Ritual, a relationship building app by Mindmaker LLC. Learn how we collect, use, and protect your data.',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindmaker LLC ("we", "us", or "our") operates Ritual ("the Service"). This Privacy 
              Policy explains how we collect, use, disclose, and safeguard your information when 
              you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Email address and name (for account creation)</li>
              <li>Profile information you choose to provide</li>
              <li>Couple connection data</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2 mt-4">Usage Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Ritual preferences and completions</li>
              <li>Location preferences (city-level only)</li>
              <li>Device and browser information</li>
              <li>App usage patterns and interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Provide and maintain the Service</li>
              <li>Generate personalized ritual suggestions</li>
              <li>Enable couple connections and synchronization</li>
              <li>Send notifications about your rituals</li>
              <li>Improve and optimize the Service</li>
              <li>Process payments for premium features</li>
              <li>Communicate with you about updates and features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. AI-Powered Features</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service uses artificial intelligence to generate personalized ritual suggestions. 
              Your preferences and activity data may be processed by AI systems to improve 
              recommendations. We do not share your personal data with third-party AI providers 
              in a way that identifies you personally.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Your connected partner (ritual data, preferences)</li>
              <li>Service providers who assist in operating the Service</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your 
              personal information, including encryption, secure servers, and access controls. 
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as 
              needed to provide the Service. You may request deletion of your account and 
              associated data at any time through the app settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and preferences. We may use 
              analytics tools to understand how users interact with the Service. You can control 
              cookie settings through your browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not intended for users under 18 years of age. We do not knowingly 
              collect personal information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. International Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your 
              own. We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or your data, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Mindmaker LLC<br />
              Email: privacy@mindmaker.io
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. California Residents (CCPA)</h2>
            <p className="text-muted-foreground leading-relaxed">
              California residents have additional rights under the California Consumer Privacy Act, 
              including the right to know what personal information is collected and the right to 
              request deletion. To exercise these rights, contact us using the information above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">15. EU/UK Residents (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you are in the EU or UK, you have rights under GDPR including access, rectification, 
              erasure, restriction, portability, and objection. Our legal basis for processing is 
              contract performance, legitimate interests, and consent where applicable.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Mindmaker LLC. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
