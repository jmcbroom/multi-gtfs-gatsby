import React, { createContext, useState, useEffect, useMemo, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [ theme, setTheme ] = useState();
    
    useEffect(() => {
        const prefersQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const updateTheme = () => {
            setTheme(prefersQuery.matches ? "dark" : "light");
        };
        updateTheme();
        
        prefersQuery.addEventListener('change', updateTheme);
        
        return () => prefersQuery.removeEventListener('change', updateTheme);
    }, [ setTheme ]);
    
    const contextPayload = useMemo(
        () => ({ theme, setTheme }), [ theme, setTheme ]
    );
    
    return (
        <ThemeContext.Provider value={contextPayload}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);