import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Heart, Calendar, Sparkles } from 'lucide-react';
import ritualLogo from '@/assets/ritual-logo.png';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen-mobile bg-gradient-warm flex flex-col items-center justify-center px-6 md:px-12 py-12">
      <main className="text-center space-y-12 max-w-4xl w-full">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img 
            src={ritualLogo} 
            alt="Ritual - Create Rituals Together" 
            className="max-w-[280px] w-full h-auto mx-auto mb-12"
          />
        </motion.div>
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Create Rituals Together
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Build weekly rituals with someone special. Both contribute, AI synthesizes your perfect week together.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 py-8"
        >
          <div className="bg-card rounded-2xl p-6 shadow-card space-y-4 transition-transform hover:-translate-y-1">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-lg text-card-foreground">Connect</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Share a code and create your ritual space together
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card space-y-4 transition-transform hover:-translate-y-1">
            <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
              <Calendar className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="font-semibold text-lg text-card-foreground">Contribute</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each week, both partners share their wishes and energy
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card space-y-4 transition-transform hover:-translate-y-1">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-lg text-card-foreground">Experience</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI crafts personalized rituals that honor both perspectives
            </p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4"
        >
          <Button 
            onClick={() => navigate('/auth')}
            size="lg" 
            className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-lg px-12 rounded-xl shadow-soft"
          >
            Get Started
          </Button>

          <p className="text-sm text-foreground/60">
            Free to start • No credit card required
          </p>
        </motion.div>
      </main>
    </div>
  );
}
