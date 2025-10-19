import { TourStep } from '../FeatureTour';

export const getHomeTourSteps = (fabPosition: { x: number; y: number; width: number; height: number }): TourStep[] => {
  return [
    {
      id: 'fab_button',
      title: 'Create Your First Note',
      description: 'Tap this button to create a new note. You can add text, images, audio recordings, and more!',
      targetPosition: {
        x: fabPosition.x,
        y: fabPosition.y,
        width: fabPosition.width,
        height: fabPosition.height,
      },
      tooltipPosition: 'top',
      shape: 'circle',
    },
  ];
};
