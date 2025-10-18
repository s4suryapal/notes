import { Dimensions } from 'react-native';
import { TourStep } from '../FeatureTour';
import { Spacing, Layout } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export const getHomeTourSteps = (fabBottom: number): TourStep[] => {
  // FAB position calculations (bottom-right)
  const fabSize = Layout.fabSize;
  const fabRight = Spacing.base;
  const fabX = width - fabRight - fabSize;
  const fabY = height - fabBottom;

  return [
    {
      id: 'fab_button',
      title: 'Create Your First Note',
      description: 'Tap this button to create a new note. You can add text, images, audio recordings, and more!',
      targetPosition: {
        x: fabX,
        y: fabY,
        width: fabSize,
        height: fabSize,
      },
      tooltipPosition: 'top',
      shape: 'circle',
    },
  ];
};
