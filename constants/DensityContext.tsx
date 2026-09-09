import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dimensions } from 'react-native';

export type DensityLevel = 'compact' | 'comfortable' | 'spacious';

interface DensityConfig {
  padding: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  minTouchTarget: number;
  cardAspectRatio: number;
  textScale: number;
  iconScale: number;
}

interface DensityContextType {
  density: DensityLevel;
  config: DensityConfig;
  setDensity: (density: DensityLevel) => void;
  getAutomatic: () => DensityLevel;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
}

const getDensityConfig = (density: DensityLevel, isTablet: boolean): DensityConfig => {
  const baseMultiplier = isTablet ? 1.2 : 1;
  
  switch (density) {
    case 'compact':
      return {
        padding: {
          xs: 4 * baseMultiplier,
          sm: 6 * baseMultiplier,
          md: 8 * baseMultiplier,
          lg: 12 * baseMultiplier,
          xl: 16 * baseMultiplier,
        },
        spacing: {
          xs: 4 * baseMultiplier,
          sm: 6 * baseMultiplier,
          md: 8 * baseMultiplier,
          lg: 12 * baseMultiplier,
          xl: 16 * baseMultiplier,
        },
        minTouchTarget: 40 * baseMultiplier,
        cardAspectRatio: 2.5,
        textScale: 0.9,
        iconScale: 0.85,
      };
    
    case 'comfortable':
      return {
        padding: {
          xs: 6 * baseMultiplier,
          sm: 8 * baseMultiplier,
          md: 12 * baseMultiplier,
          lg: 16 * baseMultiplier,
          xl: 20 * baseMultiplier,
        },
        spacing: {
          xs: 6 * baseMultiplier,
          sm: 8 * baseMultiplier,
          md: 12 * baseMultiplier,
          lg: 16 * baseMultiplier,
          xl: 20 * baseMultiplier,
        },
        minTouchTarget: 44 * baseMultiplier,
        cardAspectRatio: 2.0,
        textScale: 1.0,
        iconScale: 1.0,
      };
    
    case 'spacious':
      return {
        padding: {
          xs: 8 * baseMultiplier,
          sm: 12 * baseMultiplier,
          md: 16 * baseMultiplier,
          lg: 20 * baseMultiplier,
          xl: 24 * baseMultiplier,
        },
        spacing: {
          xs: 8 * baseMultiplier,
          sm: 12 * baseMultiplier,
          md: 16 * baseMultiplier,
          lg: 20 * baseMultiplier,
          xl: 24 * baseMultiplier,
        },
        minTouchTarget: 48 * baseMultiplier,
        cardAspectRatio: 1.8,
        textScale: 1.1,
        iconScale: 1.15,
      };
  }
};

const getAutomaticDensity = (width: number, height: number, isTablet: boolean): DensityLevel => {
  // Auto-detect based on screen size and device type
  if (isTablet) {
    return 'comfortable'; // Tablets default to comfortable
  }
  
  if (width < 375) {
    return 'compact'; // Small phones get compact
  } else if (width > 414) {
    return 'spacious'; // Large phones get spacious
  }
  
  return 'comfortable'; // Default for medium phones
};

const DensityContext = createContext<DensityContextType | null>(null);

export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768;
  
  const [density, setDensityState] = useState<DensityLevel>(() => 
    getAutomaticDensity(width, height, isTablet)
  );
  
  const config = getDensityConfig(density, isTablet);
  
  const setDensity = useCallback((newDensity: DensityLevel) => {
    setDensityState(newDensity);
  }, []);
  
  const getAutomatic = useCallback(() => {
    return getAutomaticDensity(width, height, isTablet);
  }, [width, height, isTablet]);
  
  return (
    <DensityContext.Provider value={{
      density,
      config,
      setDensity,
      getAutomatic,
      isTablet,
      screenWidth: width,
      screenHeight: height,
    }}>
      {children}
    </DensityContext.Provider>
  );
};

export const useDensity = (): DensityContextType => {
  const context = useContext(DensityContext);
  if (!context) {
    throw new Error('useDensity must be used within a DensityProvider');
  }
  return context;
};

export const useDensityStyles = <T extends Record<string, any>>(
  createStyles: (config: DensityConfig, context: DensityContextType) => T
): T => {
  const densityContext = useDensity();
  return createStyles(densityContext.config, densityContext);
};
