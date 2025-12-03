import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, Sparkles, Upload, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useCouple } from '@/contexts/CoupleContext';
import { NotificationContainer } from '@/components/InlineNotification';
import { BucketListImport } from '@/components/BucketListImport';

interface BucketListItem {
  id: string;
  title: string;
  description?: string | null;
  source: string;
  completed: boolean | null;
  created_at: string;
}

export function BucketListManager() {
  const { user, couple } = useCouple();
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (couple) {
      loadItems();
    }
  }, [couple]);

  const loadItems = async () => {
    if (!couple) return;
    
    try {
      const { data, error } = await supabase
        .from('bucket_list_items')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading bucket list:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.trim() || !couple || !user) return;

    try {
      const { data, error } = await supabase
        .from('bucket_list_items')
        .insert({
          couple_id: couple.id,
          user_id: user.id,
          title: newItem.trim(),
          source: 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      
      setItems([data, ...items]);
      setNewItem('');
      setNotification({ type: 'success', message: 'Added to bucket list!' });
      setTimeout(() => setNotification(null), 2000);
    } catch (error) {
      console.error('Error adding item:', error);
      setNotification({ type: 'error', message: 'Failed to add item' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const toggleComplete = async (item: BucketListItem) => {
    try {
      const { error } = await supabase
        .from('bucket_list_items')
        .update({ completed: !item.completed })
        .eq('id', item.id);

      if (error) throw error;
      
      setItems(items.map(i => 
        i.id === item.id ? { ...i, completed: !i.completed } : i
      ));
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bucket_list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleImportComplete = (importedItems: BucketListItem[]) => {
    setItems([...importedItems, ...items]);
    setShowImport(false);
    setNotification({ type: 'success', message: `Imported ${importedItems.length} items!` });
    setTimeout(() => setNotification(null), 3000);
  };

  const activeItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NotificationContainer notification={notification} onDismiss={() => setNotification(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Bucket List</h3>
          <span className="text-xs text-muted-foreground">({activeItems.length} dreams)</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImport(true)}
          className="text-xs"
        >
          <Upload className="w-3 h-3 mr-1" />
          Import
        </Button>
      </div>

      {/* Add New Item */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a dream experience..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          className="text-sm"
        />
        <Button onClick={addItem} size="icon" disabled={!newItem.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Active Items */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {activeItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              layout
            >
              <Card className="p-3 flex items-center gap-3 bg-white/80">
                <button
                  onClick={() => toggleComplete(item)}
                  className="w-5 h-5 rounded-full border-2 border-primary/30 flex items-center justify-center hover:border-primary transition-colors"
                >
                  {item.completed && <Check className="w-3 h-3 text-primary" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.title}</p>
                  {item.source !== 'manual' && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {item.source === 'import_text' ? <FileText className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                      Imported
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground font-medium">
            Completed ({completedItems.length})
          </p>
          {completedItems.slice(0, 3).map((item) => (
            <Card key={item.id} className="p-3 flex items-center gap-3 bg-muted/30">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground line-through truncate flex-1">
                {item.title}
              </p>
            </Card>
          ))}
          {completedItems.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{completedItems.length - 3} more completed
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-8 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Your bucket list is empty
          </p>
          <p className="text-xs text-muted-foreground">
            Add dreams or import an existing list
          </p>
        </div>
      )}

      {/* Import Modal */}
      <BucketListImport
        open={showImport}
        onOpenChange={setShowImport}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
