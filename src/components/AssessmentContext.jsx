import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AssessmentContext = createContext(null);

export function AssessmentProvider({ children }) {
  const [state, setState] = useState({ isOpen: false, edit: false, segment: null });

  // open({ segment }) starts fresh; open({ edit: true }) reloads the answers from this tab.
  const open = useCallback((options = {}) => {
    setState({ isOpen: true, edit: Boolean(options.edit), segment: options.segment ?? null });
  }, []);
  const close = useCallback(() => setState((s) => ({ ...s, isOpen: false })), []);

  const value = useMemo(() => ({ ...state, open, close }), [state, open, close]);
  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used inside <AssessmentProvider>');
  return ctx;
}
