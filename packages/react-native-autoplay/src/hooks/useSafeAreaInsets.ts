import { useContext } from 'react';
import { SafeAreaInsetsContext } from '../components/SafeAreaInsetsContext';

export const useSafeAreaInsets = () => {
  return useContext(SafeAreaInsetsContext);
};
