import axios from 'axios';

const VIETMAP_API_KEY = process.env.API_VIETMAP_KEY || '';
const VIETMAP_BASE_URL = 'https://maps.vietmap.vn/api';

export interface VietMapSearchResult {
  ref_id: string;
  distance: number;
  address: string;
  name: string;
  display: string;
  lat: number;
  lng: number;
  boundaries: any[];
}

export interface VietMapAutocompleteResult {
  ref_id: string;
  address: string;
  name: string;
  display: string;
  boundaries: any[];
}

export interface VietMapReverseResult {
  ref_id: string;
  distance: number;
  address: string;
  name: string;
  display: string;
  lat: number;
  lng: number;
}

class VietMapService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = VIETMAP_API_KEY;
    this.baseURL = VIETMAP_BASE_URL;
  }

  /**
   * Autocomplete - Gợi ý địa điểm khi người dùng đang nhập
   */
  async autocomplete(text: string, focus?: { lat: number; lng: number }): Promise<VietMapAutocompleteResult[]> {
    try {
      const params: any = {
        apikey: this.apiKey,
        text,
        display_type: 1, // Định dạng địa chỉ mới (không có Quận)
      };

      if (focus) {
        params.focus = `${focus.lat},${focus.lng}`;
      }

      const response = await axios.get(`${this.baseURL}/autocomplete/v3`, { params });
      return response.data || [];
    } catch (error) {
      console.error('VietMap Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Search/Geocoding - Chuyển địa chỉ thành tọa độ
   */
  async search(text: string, focus?: { lat: number; lng: number }): Promise<VietMapSearchResult[]> {
    try {
      const params: any = {
        apikey: this.apiKey,
        text,
        display_type: 1,
      };

      if (focus) {
        params.focus = `${focus.lat},${focus.lng}`;
      }

      const response = await axios.get(`${this.baseURL}/search/v3`, { params });
      return response.data || [];
    } catch (error) {
      console.error('VietMap Search error:', error);
      return [];
    }
  }

  /**
   * Reverse Geocoding - Chuyển tọa độ thành địa chỉ
   */
  async reverse(lat: number, lng: number): Promise<VietMapReverseResult[]> {
    try {
      const params = {
        apikey: this.apiKey,
        lat,
        lng,
        display_type: 1,
      };

      const response = await axios.get(`${this.baseURL}/reverse/v3`, { params });
      return response.data || [];
    } catch (error) {
      console.error('VietMap Reverse error:', error);
      return [];
    }
  }

  /**
   * Migrate Address - Chuyển đổi địa chỉ cũ sang mới
   */
  async migrateAddress(text: string, migrateType: 1 | 2 = 1): Promise<any> {
    try {
      const params = {
        apikey: this.apiKey,
        text,
        migrate_type: migrateType,
      };

      const response = await axios.get(`${this.baseURL}/migrate-address/v3`, { params });
      return response.data;
    } catch (error) {
      console.error('VietMap Migrate error:', error);
      return null;
    }
  }
}

export const vietMapService = new VietMapService();