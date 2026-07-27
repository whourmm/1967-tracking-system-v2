export interface Fellow {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
  photo_url?: string | null;
  country?: string | null;
  university?: string | null;
  teamflow?: string | null;
  team_id?: number | null;
  team_name?: string | null;
  completed_assignments?: number;
  total_assignments?: number;
  progress_percent?: number;
}
