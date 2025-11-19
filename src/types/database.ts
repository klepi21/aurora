export interface User {
  wallet_address: string;
  team_name: string | null;
  submitted_at: string | null;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface UserTeam {
  id: string;
  wallet_address: string;
  player_nft_identifier: string;
  position: 'GK' | 'DEF1' | 'DEF2' | 'ATT1' | 'ATT2';
  created_at: string;
  updated_at: string;
}

export interface Player {
  nft_identifier: string;
  name: string;
  collection: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface TeamSubmission {
  wallet_address: string;
  team_name: string;
  players: {
    position: 'GK' | 'DEF1' | 'DEF2' | 'ATT1' | 'ATT2';
    nft_identifier: string;
  }[];
}

