import { TourStep } from '../FeatureTour';

export const getHomeTourSteps = (fabPosition: { x: number; y: number; width: number; height: number }): TourStep[] => {
  // Add extra padding to make the spotlight more visible around the circular FAB
  const padding = 8;

  return [
    {
      id: 'fab_button',
      title: 'Tap to add your first note',
      description: 'Tap this button to create a new note. You can add text, images, audio recordings, checklists, and more!',
      targetPosition: {
        x: fabPosition.x - padding,
        y: fabPosition.y - padding,
        width: fabPosition.width + (padding * 2),
        height: fabPosition.height + (padding * 2),
      },
      tooltipPosition: 'top',
      shape: 'circle',
      isFirstNote: true,
    },
  ];
};
