import { Dimensions, Platform } from 'react-native';
import { TourStep } from '../FeatureTour';
import { Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Toolbar is at the bottom of the screen
// Icons are arranged horizontally in the RichToolbar
// Each icon is approximately 40-50px wide with some spacing

export const getEditorTourSteps = (): TourStep[] => {
  // Toolbar height is approximately 50px (from note editor styles)
  const toolbarHeight = 50;
  const toolbarY = height - toolbarHeight - (Platform.OS === 'ios' ? 34 : 0); // Account for safe area

  // Icon measurements (approximate positions in the toolbar)
  const iconSize = 24;
  const iconSpacing = 45; // Approximate spacing between icons
  const toolbarPadding = 10;

  // Calculate positions for each icon in the toolbar
  // Based on the actions array in note/[id].tsx:
  // actions={[
  //   actions.setBold, actions.setItalic, actions.setUnderline,
  //   actions.insertBulletsList, actions.insertOrderedList,
  //   'checklist', 'scanner', 'ocr', 'camera', 'gallery', 'microphone', 'palette',
  //   actions.keyboard, actions.removeFormat, actions.undo, actions.redo
  // ]}

  // We want to highlight: scanner (index 6), ocr (7), camera (8), gallery (9), microphone (10), checklist (5), palette (11)
  const checklistIndex = 5;
  const scannerIndex = 6;
  const ocrIndex = 7;
  const cameraIndex = 8;
  const galleryIndex = 9;
  const microphoneIndex = 10;
  const paletteIndex = 11;

  const getIconPosition = (index: number) => ({
    x: toolbarPadding + (index * iconSpacing),
    y: toolbarY + (toolbarHeight - iconSize) / 2,
    width: iconSize + 16, // Add padding for hit area
    height: iconSize + 16,
  });

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
