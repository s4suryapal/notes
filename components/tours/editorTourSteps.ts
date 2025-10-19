import { Dimensions } from 'react-native';
import { TourStep } from '../FeatureTour';

const { width } = Dimensions.get('window');

export const getEditorTourSteps = (toolbarPosition: { x: number; y: number; width: number; height: number }): TourStep[] => {
  // RichToolbar actions array from note/[id].tsx:
  // actions={[
  //   actions.setBold, actions.setItalic, actions.setUnderline,
  //   actions.insertBulletsList, actions.insertOrderedList,
  //   'checklist', 'scanner', 'ocr', 'camera', 'gallery', 'microphone', 'palette',
  //   actions.keyboard, actions.removeFormat, actions.undo, actions.redo
  // ]}
  // Total: 16 actions

  // Calculate icon spacing dynamically based on toolbar width
  const totalActions = 16;
  const iconSize = 24;
  const hitAreaPadding = 16;
  const toolbarPadding = 12;
  const availableWidth = toolbarPosition.width - (toolbarPadding * 2);
  const iconSpacing = availableWidth / totalActions;

  // We want to highlight: scanner (index 6), ocr (7), camera (8), gallery (9), microphone (10), checklist (5), palette (11)
  const checklistIndex = 5;
  const scannerIndex = 6;
  const ocrIndex = 7;
  const cameraIndex = 8;
  const galleryIndex = 9;
  const microphoneIndex = 10;
  const paletteIndex = 11;

  const getIconPosition = (index: number) => {
    const centerX = toolbarPosition.x + toolbarPadding + (index * iconSpacing) + (iconSpacing / 2);
    const centerY = toolbarPosition.y + (toolbarPosition.height / 2);

    return {
      x: centerX - (iconSize + hitAreaPadding) / 2,
      y: centerY - (iconSize + hitAreaPadding) / 2,
      width: iconSize + hitAreaPadding,
      height: iconSize + hitAreaPadding,
    };
  };

  return [
    {
      id: 'document_scanner',
      title: 'Document Scanner',
      description: 'Scan receipts, documents, and forms in high quality with auto-edge detection and image enhancement.',
      targetPosition: getIconPosition(scannerIndex),
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'text_extraction',
      title: 'Text Extraction (OCR)',
      description: 'Extract text from images automatically. Perfect for capturing text from photos, screenshots, or documents.',
      targetPosition: getIconPosition(ocrIndex),
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'camera_image',
      title: 'Camera & Images',
      description: 'Take photos or choose from gallery to add visual content to your notes.',
      targetPosition: getIconPosition(cameraIndex),
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'audio_recording',
      title: 'Voice Recording',
      description: 'Record voice memos and audio notes. Great for capturing ideas on the go!',
      targetPosition: getIconPosition(microphoneIndex),
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'checklist',
      title: 'Interactive Checklists',
      description: 'Create to-do lists and checklists within your notes. Check items off as you complete them.',
      targetPosition: getIconPosition(checklistIndex),
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
    {
      id: 'backgrounds',
      title: 'Beautiful Backgrounds',
      description: 'Customize your note with colors, gradients, and patterns to organize and beautify your notes.',
      targetPosition: getIconPosition(paletteIndex),
      tooltipPosition: 'top',
      shape: 'rectangle',
    },
  ];
};
