import { useTheme } from './ThemeContext';
import mapboxStyles from '../styles/styleFactory';
import { cloneDeep } from 'lodash-es';

/**
 * Hook that returns the current theme and a cloned Mapbox style object.
 * Returns { theme: null, style: null } if theme is not yet available.
 */
export function useMapStyle() {
  const { theme } = useTheme();

  if (!theme) {
    return { theme: null, style: null };
  }

  const style = cloneDeep(mapboxStyles[theme]);
  return { theme, style };
}
