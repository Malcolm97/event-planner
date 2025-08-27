export interface EventItem {
  id: string;
  name: string;
  category?: string;
  location: string;
  venue?: string;
  presale_price?: number;
  gate_price?: number;
  description: string;
  image_urls?: string[] | string | null;
  created_at?: string;
  featured?: boolean;
  date: string;
  created_by?: string;
}
