export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  region: string;
}

export const DEMO_USERS: UserProfile[] = [
  {
    name: 'Shristi S.',
    email: 'shristi@greencompute.io',
    role: 'Orchestrator Lead',
    avatarInitials: 'SS',
    region: 'India (IN Grid)'
  },
  {
    name: 'Alex Chen',
    email: 'alex.chen@greencompute.io',
    role: 'ML Infrastructure Lead',
    avatarInitials: 'AC',
    region: 'US East (PJM)'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.s@greencompute.io',
    role: 'Sustainability & ESG Director',
    avatarInitials: 'PS',
    region: 'Europe West (DE)'
  }
];
