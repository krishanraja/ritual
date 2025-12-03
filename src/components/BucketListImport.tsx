import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Image, Upload, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useCouple } from '@/contexts/CoupleContext';

interface BucketListItem {
  id: string;
  title: string;
  description?: string | null;
  source: string;
  completed: boolean | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (items: BucketListItem[]) => void;
}

export function BucketListImport({ open, onOpenChange, onImportComplete }: Props) {
  const { user, couple } = useCouple();
  const [mode, setMode] = useState<'select' | 'text' | 'image'>('select');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseTextInput = () => {
    const lines = textInput
      .split(/[\n,;]/)
      .map(line => line.trim())
      .filter(line => line.length > 2 && line.length < 200);
    
    setParsedItems(lines);
    setSelectedItems(new Set(lines.map((_, i) => i)));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Call edge function for OCR
        const { data, error } = await supabase.functions.invoke('parse-bucket-list', {
          body: { imageData: base64 }
        });

        if (error) throw error;
        
        const items = data?.items || [];
        setParsedItems(items);
        setSelectedItems(new Set(items.map((_: string, i: number) => i)));
        setMode('image');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error parsing image:', error);
      setParsedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const importSelected = async () => {
    if (!couple || !user || selectedItems.size === 0) return;

    setLoading(true);
    try {
      const itemsToInsert = Array.from(selectedItems).map(index => ({
        couple_id: couple.id,
        user_id: user.id,
        title: parsedItems[index],
        source: mode === 'text' ? 'import_text' : 'import_image',
      }));

      const { data, error } = await supabase
        .from('bucket_list_items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;

      onImportComplete(data || []);
      resetState();
    } catch (error) {
      console.error('Error importing items:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setMode('select');
    setTextInput('');
    setParsedItems([]);
    setSelectedItems(new Set());
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Bucket List</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Import your existing bucket list or dreams
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('text')}
                  className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-center space-y-2"
                >
                  <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Paste Text</p>
                  <p className="text-xs text-muted-foreground">Copy & paste a list</p>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-center space-y-2"
                >
                  <Image className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Image</p>
                  <p className="text-xs text-muted-foreground">Screenshot of a list</p>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </motion.div>
          )}

          {mode === 'text' && parsedItems.length === 0 && (
            <motion.div
              key="text-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Textarea
                placeholder="Paste your bucket list here...&#10;&#10;Each line or item separated by commas will become a separate entry."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[150px] text-sm"
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode('select')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={parseTextInput} 
                  disabled={!textInput.trim()}
                  className="flex-1"
                >
                  Parse Items
                </Button>
              </div>
            </motion.div>
          )}

          {(mode === 'text' || mode === 'image') && parsedItems.length > 0 && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {parsedItems.length} items
                </p>
                <button
                  onClick={() => {
                    if (selectedItems.size === parsedItems.length) {
                      setSelectedItems(new Set());
                    } else {
                      setSelectedItems(new Set(parsedItems.map((_, i) => i)));
                    }
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {selectedItems.size === parsedItems.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="max-h-[250px] overflow-y-auto space-y-2">
                {parsedItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => toggleItem(index)}
                    className={`w-full p-3 rounded-lg text-left text-sm flex items-center gap-3 transition-all ${
                      selectedItems.has(index)
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted/50 border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedItems.has(index)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      {selectedItems.has(index) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate flex-1">{item}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetState} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={importSelected} 
                  disabled={selectedItems.size === 0 || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `Import ${selectedItems.size} Items`
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {loading && mode === 'select' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-3"
            >
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Reading your list...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
