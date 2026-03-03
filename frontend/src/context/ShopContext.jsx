import { createContext, useEffect, useMemo, useState } from "react";
import { products } from "../assets/assets"; // mock data như video

export const ShopContext = createContext(null);

function loadCart() {
  try {
    const raw = localStorage.getItem("cartItems");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const ShopContextProvider = ({ children }) => {
  const currency = "₫";
  const delivery_fee = 30000;

  const [cartItems, setCartItems] = useState(() => loadCart());

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (id, qty = 1) => {
    setCartItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  };

  const removeFromCart = (id, qty = 1) => {
    setCartItems((prev) => {
      const current = prev[id] || 0;
      const next = current - qty;
      const copy = { ...prev };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  };

  const updateCartQty = (id, qty) => {
    const n = Number(qty);
    setCartItems((prev) => {
      const copy = { ...prev };
      if (!n || n <= 0) delete copy[id];
      else copy[id] = n;
      return copy;
    });
  };

  const getCartCount = () =>
    Object.values(cartItems).reduce((sum, q) => sum + q, 0);

  // tạm tính amount dựa trên mock products
  const getCartAmount = () => {
    let total = 0;
    for (const id in cartItems) {
      const item = products.find((p) => String(p._id || p.id) === String(id));
      if (item) total += (item.price || 0) * cartItems[id];
    }
    return total;
  };

  const value = useMemo(
    () => ({
      products,
      currency,
      delivery_fee,
      cartItems,
      addToCart,
      removeFromCart,
      updateCartQty,
      getCartCount,
      getCartAmount,
    }),
    [cartItems]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;