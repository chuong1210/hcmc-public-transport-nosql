import axios from 'axios';

const PROVINCES_API = 'https://provinces.open-api.vn/api/v2';

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
interface ProvinceWithWards {
  province: Province | null;
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
 async getProvinceWithWards(provinceCode: number) {
    try {
      const response = await axios.get(`${this.baseURL}/p/${provinceCode}`, {
        params: { depth: 2 }, // depth=2 trả về wards
      });

      const province = response.data;
      const wards: Ward[] = [];

      if (province.districts && Array.isArray(province.districts)) {
        province.districts.forEach((district: any) => {
          if (district.wards && Array.isArray(district.wards)) {
            district.wards.forEach((ward: any) => {
              wards.push({
                code: ward.code,
                name: ward.name,
                codename: ward.codename,
                division_type: ward.division_type,
                province_code: province.code,
              });
            });
          }
        });
      }

      return {
        province: {
          code: province.code,
          name: province.name,
          codename: province.codename,
          division_type: province.division_type,
          phone_code: province.phone_code,
        },
        wards,
      };
    } catch (error) {
      console.error('Error fetching province with wards:', error);
      return { province: null, wards: [] };
    }
  }

  // Get all wards in a province (flat, no districts)
  async getAllWardsInProvince(provinceCode: number): Promise<Ward[]> {
    try {
      const response = await axios.get(`${this.baseURL}/w/`, {
        params: { province: provinceCode }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all wards:', error);
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

  // Get Ho Chi Minh City (code: 79) with all wards
async getHCMCWithWards(): Promise<ProvinceWithWards> {
    const wards = await this.getAllWardsInProvince(79);
    return {
      province: {
        code: 79,
        name: 'TP.HCM',
        codename: 'ho_chi_minh',
        division_type: 'thành phố trung ương',
        phone_code: 28,
      },
      wards,
    };
  }
  // Helper: Format ward for display
  formatWardDisplay(ward: Ward): string {
    return `${ward.name}`;
  }

  // Helper: Format province for display
  formatProvinceDisplay(province: Province): string {
    return province.name;
  }
}

export const provincesAPI = new ProvincesAPI();