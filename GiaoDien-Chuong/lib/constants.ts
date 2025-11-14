export const STATION_TYPES = [
  { value: 'terminal', label: 'Đầu cuối' },
  { value: 'intermediate', label: 'Trung gian' },
  { value: 'stop', label: 'Điểm dừng' },
] as const;

export const STATION_STATUS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
] as const;

export const ROUTE_TYPES = [
  { value: 'normal', label: 'Thường' },
  { value: 'express', label: 'Nhanh' },
  { value: 'rapid', label: 'Express' },
] as const;

export const ROUTE_STATUS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
] as const;

export const USER_ROLES = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'manager', label: 'Quản lý' },
  { value: 'user', label: 'Người dùng' },
] as const;

export const DISTRICTS = [
  'Quận 1',
  'Quận 2',
  'Quận 3',
  'Quận 4',
  'Quận 5',
  'Quận 6',
  'Quận 7',
  'Quận 8',
  'Quận 9',
  'Quận 10',
  'Quận 11',
  'Quận 12',
  'Quận Bình Thạnh',
  'Quận Bình Tân',
  'Quận Gò Vấp',
  'Quận Phú Nhuận',
  'Quận Tân Bình',
  'Quận Tân Phú',
  'Quận Thủ Đức',
] as const;

export const OPERATORS = [
  'SAMCO',
  'FUTA',
  'Phương Trang',
  'Mai Linh',
] as const;