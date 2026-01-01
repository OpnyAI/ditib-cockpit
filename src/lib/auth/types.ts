export type Role = "ADMIN" | "BUCHHALTER" | "KOMMUNIKATION";

export type Profile = {
  user_id: string;
  tenant_id: string | null;
  role: Role;
  display_name: string | null;
  is_board_member: boolean;
  created_at: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  directory_id: string | null;
  created_at: string;
};
