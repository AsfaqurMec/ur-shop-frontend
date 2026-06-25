export const FB_PIXEL = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

// declare global {
//   interface Window {
//     fbq: any;
//   }
// }

export const pageView = () => {
  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};

export const viewContent = (
  productId: string,
  productName: string,
  price: number
) => {
  if (typeof window.fbq === "function") {
    window.fbq("track", "ViewContent", {
      content_ids: [productId],
      content_name: productName,
      content_type: "product",
      value: price,
      currency: "BDT",
    });
  }
};

export const addToCart = (
  productId: string,
  productName: string,
  price: number
) => {
  if (typeof window.fbq === "function") {
    window.fbq("track", "AddToCart", {
      content_ids: [productId],
      content_name: productName,
      value: price,
      currency: "BDT",
    });
  }
};

export const initiateCheckout = (total: number) => {
  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      value: total,
      currency: "BDT",
    });
  }
};

export const purchase = (
  orderId: string,
  total: number,
  productIds: string[]
) => {
  if (typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      order_id: orderId,
      value: total,
      currency: "BDT",
      content_ids: productIds,
    });
  }
};