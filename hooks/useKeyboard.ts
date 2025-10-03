import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

interface KeyboardState {
  height: number;
  isVisible: boolean;
}

const initialState: KeyboardState = {
  height: 0,
  isVisible: false,
};

export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>(initialState);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleShow = (event: KeyboardEvent) => {
      setState({
        height: event.endCoordinates.height,
        isVisible: true,
      });
    };

    const handleHide = () => {
      setState(initialState);
    };

    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return state;
}
