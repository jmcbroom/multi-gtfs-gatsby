
export interface AgencySlug {
  current: string;
};

export interface Color {
  hex: string;
}

export interface AgencyType {
  slug: AgencySlug;
  name: string;
  color: Color;
  textColor: Color;
};