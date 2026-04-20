import type { User } from '../types';

export const localAuthSeedUsers: User[] = [
  {
    _id: 'local-admin-seed',
    username: 'admin@milosystem.local',
    email: 'admin@milosystem.local',
    password: '123456',
    name: 'ผู้ดูแลระบบท้องถิ่น',
    role: 'admin',
  },
];
