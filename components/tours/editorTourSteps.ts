import { TourStep } from '../FeatureTour';

export const getEditorTourSteps = (toolbarPosition: { x: number; y: number; width: number; height: number }): TourStep[] => {
  // Simplified approach: Highlight the entire toolbar instead of individual icons
  // This avoids positioning issues and provides a clearer overview of features

  return [
    {
      id: 'rich_toolbar_overview',
      title: 'Powerful Editing Toolbar',
      description: 'Your toolbar is packed with features! Use the icons to format text (Bold, Italic, Lists), add content (Camera, Voice, Scanner), and customize your note.',
      targetPosition: {
        x: toolbarPosition.x,
        y: toolbarPosition.y,
        width: toolbarPosition.width,
        height: toolbarPosition.height,
      },
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'document_scanner',
      title: '📄 Document Scanner',
      description: 'Scan receipts, documents, and forms in high quality with auto-edge detection and image enhancement. Perfect for digitizing paperwork!',
      targetPosition: {
        x: toolbarPosition.x,
        y: toolbarPosition.y,
        width: toolbarPosition.width,
        height: toolbarPosition.height,
      },
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'text_extraction',
      title: '🔍 Text Extraction (OCR)',
      description: 'Extract and convert text from images automatically. Capture text from photos, screenshots, or scanned documents instantly.',
      targetPosition: {
        x: toolbarPosition.x,
        y: toolbarPosition.y,
        width: toolbarPosition.width,
        height: toolbarPosition.height,
      },
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'media_capture',
      title: '📷 Photos & Gallery',
      description: 'Take photos with your camera or choose images from your gallery to add visual content to your notes.',
      targetPosition: {
        x: toolbarPosition.x,
        y: toolbarPosition.y,
        width: toolbarPosition.width,
        height: toolbarPosition.height,
      },
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'audio_recording',
      title: '🎤 Voice Recording',
      description: 'Record voice memos and audio notes directly in your note. Great for capturing ideas, lectures, or meetings on the go!',
      targetPosition: {
        x: toolbarPosition.x,
        y: toolbarPosition.y,
        width: toolbarPosition.width,
        height: toolbarPosition.height,
      },
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'checklist',
      title: '✓ Interactive Checklists',
      description: 'Create to-do lists and checklists within your notes. Check items off as you complete tasks to stay organized.',
      targetPosition: {
        x: toolbarPosition.x,
        y: toolbarPosition.y,
        width: toolbarPosition.width,
        height: toolbarPosition.height,
      },
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'backgrounds',
      title: '🎨 Beautiful Backgrounds',
      description: 'Customize your note with colors, gradients, and patterns. Organize notes visually and make them beautiful!',
      targetPosition: {
        x: toolbarPosition.x,
        y: toolbarPosition.y,
        width: toolbarPosition.width,
        height: toolbarPosition.height,
      },
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
  ];
};
