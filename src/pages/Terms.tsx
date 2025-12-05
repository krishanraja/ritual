import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSEO } from '@/hooks/useSEO';

export default function Terms() {
  const navigate = useNavigate();

  useSEO({
    title: 'Terms & Conditions',
    description: 'Terms and Conditions for using Ritual, a relationship building app by Mindmaker LLC.',
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

        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Ritual ("the Service"), operated by Mindmaker LLC ("we", "us", or "our"), 
              you agree to be bound by these Terms & Conditions. If you do not agree to these terms, 
              please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ritual is a relationship-building application that helps couples create and maintain 
              meaningful weekly rituals together. The Service includes AI-powered suggestions, 
              location-based recommendations, and activity tracking features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use certain features of the Service, you must create an account. You are responsible 
              for maintaining the confidentiality of your account credentials and for all activities 
              that occur under your account. You must provide accurate and complete information when 
              creating your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Couple Connections</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service allows you to connect with a partner using a unique couple code. You may 
              only connect with individuals who have consented to share data with you. You are 
              responsible for ensuring you have appropriate consent before connecting with another user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Subscription & Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              Some features of the Service require a paid subscription. Subscriptions are billed 
              on a recurring basis. You may cancel your subscription at any time through your 
              account settings. Refunds are handled in accordance with our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. User Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of any content you submit to the Service. By submitting content, 
              you grant us a non-exclusive, worldwide, royalty-free license to use, store, and 
              process your content solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Prohibited Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Create multiple accounts for fraudulent purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
              IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR 
              SECURE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MINDMAKER LLC SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR 
              USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any 
              material changes via email or through the Service. Your continued use of the Service 
              after such changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the 
              United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Mindmaker LLC<br />
              Email: legal@mindmaker.io
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
