import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ViewCoupleCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupleCode: string;
}

export const ViewCoupleCodeDialog = ({ open, onOpenChange, coupleCode }: ViewCoupleCodeDialogProps) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(coupleCode);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-warm border-none shadow-card rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold text-foreground">
            Your Couple Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <p className="text-center text-muted-foreground">
            Share this code with your partner so they can join your ritual space
          </p>
          
          <div className="bg-white/80 rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Couple Code</p>
              <p className="text-4xl font-bold text-primary tracking-wider">
                {coupleCode}
              </p>
            </div>
            
            <Button
              onClick={copyCode}
              variant="outline"
              className="w-full border-2 border-primary/30 rounded-xl h-12"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-ritual text-white hover:opacity-90 h-12 rounded-xl"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
