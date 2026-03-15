'use client';

import { useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMealStore } from '@/lib/store/useMealStore';
import { BatchChecklistItem } from '@/components/BatchChecklistItem';
import { fr } from '@/lib/i18n/fr';
import { useState } from 'react';

const categoryLabels: Record<string, string> = {
  protein: fr.batchCook.proteins,
  cereal: fr.batchCook.cereals,
  vegetable: fr.batchCook.vegetables,
  sauce: fr.batchCook.sauces,
};

const categoryOrder = ['protein', 'cereal', 'vegetable', 'sauce'] as const;

const timelineSteps = [
  { label: fr.batchCook.timeline.oven, emoji: '🔥', method: 'four' },
  { label: fr.batchCook.timeline.steam, emoji: '💨', method: 'vapeur' },
  { label: fr.batchCook.timeline.pan, emoji: '🍳', method: 'poêle' },
  { label: fr.batchCook.timeline.eggs, emoji: '🥚', method: 'cru' },
];

function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const particles: { x: number; y: number; vx: number; vy: number; color: string; life: number }[] = [];
  const colors = ['#F4A261', '#048A81', '#E07A5F', '#3D405B', '#7DC243'];

  for (let i = 0; i < 30; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 60,
    });
  }

  let frame = 0;
  function animate() {
    if (frame > 60) {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      ctx!.globalAlpha = Math.max(0, p.life / 60);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(p.x, p.y, 4, 4);
    });
    ctx!.globalAlpha = 1;
    frame++;
    requestAnimationFrame(animate);
  }
  animate();
}

export default function BatchCookPage() {
  const { batchItems, toggleBatchItem, resetBatch } = useMealStore();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const checkedCount = batchItems.filter((i) => i.checked).length;
  const totalCount = batchItems.length;
  const totalMinutes = batchItems.reduce((s, i) => s + i.estimatedMinutes, 0);
  const remainingMinutes = batchItems.filter((i) => !i.checked).reduce((s, i) => s + i.estimatedMinutes, 0);

  const grouped = useMemo(() => {
    const map: Record<string, typeof batchItems> = {};
    for (const cat of categoryOrder) {
      map[cat] = batchItems.filter((i) => i.category === cat);
    }
    return map;
  }, [batchItems]);

  const handleToggle = useCallback((id: string) => {
    toggleBatchItem(id);
    const item = batchItems.find((i) => i.id === id);
    if (item && !item.checked && canvasRef.current) {
      fireConfetti(canvasRef.current);
    }
  }, [toggleBatchItem, batchItems]);

  return (
    <div className="py-6 space-y-6 relative">
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50"
        width={typeof window !== 'undefined' ? window.innerWidth : 400}
        height={typeof window !== 'undefined' ? window.innerHeight : 800}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{fr.batchCook.title}</h1>
          <p className="text-sm text-gray-500">{remainingMinutes} {fr.batchCook.estimated}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {checkedCount}/{totalCount} {fr.batchCook.prepared}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => setShowResetDialog(true)} aria-label={fr.batchCook.reset}>
            <RotateCcw size={18} />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[var(--color-meal-breakfast)] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(checkedCount / totalCount) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Timeline */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {timelineSteps.map((step) => (
          <div
            key={step.method}
            className="flex items-center gap-1 bg-gray-50 rounded-full px-3 py-1.5 text-xs shrink-0"
          >
            <span>{step.emoji}</span>
            <span className="font-medium">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Sections */}
      {categoryOrder.map((cat) => (
        <div key={cat}>
          <h2 className="text-sm font-semibold mb-2 text-gray-600">{categoryLabels[cat]}</h2>
          <div className="space-y-2">
            <AnimatePresence>
              {grouped[cat].map((item) => (
                <BatchChecklistItem key={item.id} item={item} onToggle={handleToggle} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}

      {/* Reset dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{fr.batchCook.reset}</DialogTitle>
            <DialogDescription>{fr.batchCook.resetConfirm}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={() => { resetBatch(); setShowResetDialog(false); }}>
              Réinitialiser
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
