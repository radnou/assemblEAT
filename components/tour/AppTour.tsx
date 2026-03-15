'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface AppTourProps {
  onComplete: () => void;
}

interface TourStep {
  emoji: string;
  titleKey: string;
  descriptionKey: string;
  isLast?: boolean;
}

const STEPS: TourStep[] = [
  {
    emoji: '🏠',
    titleKey: 'step1.title',
    descriptionKey: 'step1.description',
  },
  {
    emoji: '📅',
    titleKey: 'step2.title',
    descriptionKey: 'step2.description',
  },
  {
    emoji: '👨‍🍳',
    titleKey: 'step3.title',
    descriptionKey: 'step3.description',
  },
  {
    emoji: '😊',
    titleKey: 'step4.title',
    descriptionKey: 'step4.description',
  },
  {
    emoji: '✨',
    titleKey: 'step5.title',
    descriptionKey: 'step5.description',
    isLast: true,
  },
];

export function AppTour({ onComplete }: AppTourProps) {
  const t = useTranslations('tour');
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark overlay */}
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Tour card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center text-center"
          >
            {/* Step indicator */}
            <p className="text-xs text-gray-400 font-medium mb-4 self-end">
              {currentStep + 1}/{totalSteps}
            </p>

            {/* Emoji */}
            <span className="text-4xl mb-4" role="img" aria-hidden="true">
              {step.emoji}
            </span>

            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t(step.titleKey)}
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {t(step.descriptionKey)}
            </p>

            {/* CTA button */}
            {step.isLast ? (
              <button
                onClick={handleNext}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm mb-3"
                style={{ backgroundColor: 'var(--color-cta)' }}
              >
                {t('discoverPro')}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm mb-3"
                style={{ backgroundColor: 'var(--color-cta)' }}
              >
                {t('next')}
              </button>
            )}

            {/* Skip / Finish link */}
            <button
              onClick={handleSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {step.isLast ? t('finish') : t('skip')}
            </button>

            {/* Step dots */}
            <div className="flex gap-1.5 mt-4">
              {STEPS.map((_, index) => (
                <span
                  key={index}
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-4 bg-gray-800'
                      : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
