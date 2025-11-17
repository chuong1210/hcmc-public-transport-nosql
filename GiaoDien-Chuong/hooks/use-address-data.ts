import { useState, useEffect } from 'react';
import { provincesAPI, type Province, type Ward } from '@/lib/provinces';

export function useAddressData() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all provinces
  const loadProvinces = async () => {
    setLoading(true);
    const data = await provincesAPI.getProvinces();
    setProvinces(data);
    setLoading(false);
  };

  // Load wards of a province
  const loadWards = async (provinceCode: number) => {
    setLoading(true);
    const data = await provincesAPI.getProvinceWithWards(provinceCode);
    if (data) {
      setWards(data.wards);
    }
    setLoading(false);
  };

  // Load HCMC wards by default
  const loadHCMC = async () => {
    setLoading(true);
    const data = await provincesAPI.getHCMCWithWards();
    if (data) {
      setWards(data.wards);
    }
    setLoading(false);
  };

  return {
    provinces,
    wards,
    loading,
    loadProvinces,
    loadWards,
    loadHCMC,
  };
}