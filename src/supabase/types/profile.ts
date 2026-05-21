export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  language: string | null;
  kennitala: string | null;
  kennitala_verified_at: string | null;
};

export type ProfileUpdate = {
  full_name?: string;
  language?: string;
};
