
import type { Product } from "./product";

export interface CartItem {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product?: Product;
  selected_color_id?: string | null;
  selected_color_name?: string | null;
  selected_size_id?: string | null;
  selected_size_label?: string | null;
  selected_volume_id?: string | null;
  selected_volume_label?: string | null;
}

export interface SelectedAttributes {
  color_id?: string;
  color_name?: string;
  size_id?: string;
  size_label?: string;
  volume_id?: string;
  volume_label?: string;
}
