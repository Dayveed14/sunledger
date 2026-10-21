import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const ShopContext = createContext(null);
const KEY = 'sunledger.shop.v1';

const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && Array.isArray(v.cart)) return v;
  } catch { /* storage unavailable: start empty */ }
  return { cart: [], mode: 'current', other: null };
};

// The shopper's cart and where they want things delivered. "Current location" is the address on their account;
// "Order for a different location" is an address they type in. Both are limited to one state, because we only
// deliver inside a state.
export function ShopProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const saved = user?.address?.line ? { line: user.address.line, state: user.address.state, areaId: user.address.areaId, areaName: user.address.areaName, stateName: user.address.stateName } : null;
  const mode = state.mode === 'current' && saved ? 'current' : 'other';
  const dest = mode === 'current' ? saved : state.other;

  const setOther = useCallback((other) => {
    setState((s) => ({ ...s, mode: 'other', other, cart: s.cart.filter((i) => i.state === other.state) }));
  }, []);
  const useCurrent = useCallback(() => {
    setState((s) => ({ ...s, mode: 'current', cart: saved ? s.cart.filter((i) => i.state === saved.state) : s.cart }));
  }, [saved]);

  const add = useCallback((item, qty = 1) => {
    setState((s) => {
      const found = s.cart.find((i) => i.kind === item.kind && i.id === item.id);
      const cart = found
        ? s.cart.map((i) => (i === found ? { ...i, qty: Math.min(20, i.qty + qty) } : i))
        : [...s.cart, { ...item, qty: Math.min(20, qty) }];
      return { ...s, cart };
    });
  }, []);
  const setQty = useCallback((kind, id, qty) => {
    setState((s) => ({ ...s, cart: qty < 1 ? s.cart.filter((i) => !(i.kind === kind && i.id === id)) : s.cart.map((i) => (i.kind === kind && i.id === id ? { ...i, qty: Math.min(20, qty) } : i)) }));
  }, []);
  const clear = useCallback(() => setState((s) => ({ ...s, cart: [] })), []);

  const value = useMemo(() => ({
    cart: state.cart, count: state.cart.reduce((n, i) => n + i.qty, 0), dest, mode, hasSaved: Boolean(saved), saved,
    setOther, useCurrent, add, setQty, clear,
  }), [state.cart, dest, mode, saved, setOther, useCurrent, add, setQty, clear]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
