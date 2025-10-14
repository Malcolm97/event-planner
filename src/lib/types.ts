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
  updated_at?: string;
  featured?: boolean;
  date: string;
  end_date?: string | null;
  created_by?: string;
}
