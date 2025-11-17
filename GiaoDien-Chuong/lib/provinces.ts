import axios from 'axios';

const PROVINCES_API = 'https://provinces.open-api.vn/api';

export interface Province {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
}

export interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  province_code: number;
}

export interface ProvinceDetail extends Province {
  wards: Ward[];
}

class ProvincesAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = PROVINCES_API;
  }

  // Get all provinces
  async getProvinces(): Promise<Province[]> {
    try {
      const response = await axios.get(`${this.baseURL}/p/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  }

  // Get province with wards (depth=2 để lấy cả phường/xã)
  async getProvinceWithWards(provinceCode: number): Promise<ProvinceDetail | null> {
    try {
      const response = await axios.get(`${this.baseURL}/p/${provinceCode}`, {
        params: { depth: 2 }
      });
      
      // API trả về districts, nhưng ta cần flatten thành wards
      const data = response.data;
      const allWards: Ward[] = [];
      
      if (data.districts && Array.isArray(data.districts)) {
        data.districts.forEach((district: any) => {
          if (district.wards && Array.isArray(district.wards)) {
            district.wards.forEach((ward: any) => {
              allWards.push({
                code: ward.code,
                name: ward.name,
                codename: ward.codename,
                division_type: ward.division_type,
                province_code: provinceCode,
              });
            });
          }
        });
      }
      
      return {
        code: data.code,
        name: data.name,
        codename: data.codename,
        division_type: data.division_type,
        phone_code: data.phone_code,
        wards: allWards,
      };
    } catch (error) {
      console.error('Error fetching province details:', error);
      return null;
    }
  }

  // Get wards by province code
  async getWardsByProvince(provinceCode: number): Promise<Ward[]> {
    try {
      const response = await axios.get(`${this.baseURL}/w/`, {
        params: { province: provinceCode }
      });
      
      return response.data.map((ward: any) => ({
        code: ward.code,
        name: ward.name,
        codename: ward.codename,
        division_type: ward.division_type,
        province_code: provinceCode,
      }));
    } catch (error) {
      console.error('Error fetching wards:', error);
      return [];
    }
  }

  // Search provinces
  async searchProvinces(search: string): Promise<Province[]> {
    try {
      const response = await axios.get(`${this.baseURL}/p/`, {
        params: { search }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching provinces:', error);
      return [];
    }
  }

  // Get Ho Chi Minh City (code: 79) with wards
  async getHCMCWithWards(): Promise<ProvinceDetail | null> {
    return this.getProvinceWithWards(79);
  }
}

export const provincesAPI = new ProvincesAPI();