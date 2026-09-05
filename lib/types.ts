export type Category = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  is_hidden: boolean;
  prep_info: string | null;
};

export type CartLine = {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
};

export type OrderStatus =
  | "received"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type TrackedOrder = {
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  payment_status: string;
  total: number;
  fulfillment_type: string;
  created_at: string;
  items: { product_name: string; quantity: number; unit_price: number; line_total: number }[];
};
